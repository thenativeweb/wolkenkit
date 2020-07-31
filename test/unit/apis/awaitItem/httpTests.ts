import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../../lib/common/utils/test/buildCommandWithMetadata';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { createPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/createPriorityQueueStore';
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from '../../../../lib/common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/awaitItem/http';
import { getCommandWithMetadataSchema } from '../../../../lib/common/schemas/getCommandWithMetadataSchema';
import { InMemoryPublisher } from '../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher';
import { InMemorySubscriber } from '../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { regex } from '../../../../lib/common/utils/uuid';
import { runAsServer } from '../../../shared/http/runAsServer';
import { sleep } from '../../../../lib/common/utils/sleep';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { v4 } from 'uuid';
import { Value } from 'validate-value';

suite('awaitItem/http', (): void => {
  suite('/v2', (): void => {
    const expirationTime = 600;
    const pollInterval = 500;

    let api: ExpressApplication,
        newItemPublisher: Publisher<object>,
        newItemSubscriber: Subscriber<object>,
        newItemSubscriberChannel: string,
        priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;

    setup(async (): Promise<void> => {
      newItemSubscriber = await InMemorySubscriber.create();
      newItemSubscriberChannel = v4();
      newItemPublisher = await InMemoryPublisher.create();

      priorityQueueStore = await createPriorityQueueStore({
        type: 'InMemory',
        doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata,
        options: { expirationTime }
      });

      ({ api } = await getApi({
        corsOrigin: '*',
        priorityQueueStore,
        newItemSubscriber,
        newItemSubscriberChannel,
        validateOutgoingItem ({ item }: { item: any }): void {
          new Value(getCommandWithMetadataSchema()).validate(item);
        }
      }));
    });

    suite('GET /', (): void => {
      test('returns the status code 200.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns the content-type application/x-ndjson.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { headers } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
      });

      test('leaves the connection open indefinitely as long as no command is enqueued.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise(async (resolve, reject): Promise<void> => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            reject(new Error('Stream should not have closed yet.'));
          });

          data.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            }
          ]));

          await sleep({ ms: pollInterval });

          resolve();
        });
      });

      test('closes the connection once a command has been delivered and a notification has been sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: v4()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandWithMetadata);
              assert.that(streamElement.metadata.token).is.matching(regex);
            }
          ]));
        });
      });

      test('redelivers the same command if the timeout expires.', async function (): Promise<void> {
        this.timeout(5_000);

        const { client } = await runAsServer({ app: api });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleContext',
            id: v4()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        const { data: dataFirstTry } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve): void => {
          dataFirstTry.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandWithMetadata);
              assert.that(streamElement.metadata.token).is.matching(regex);

              resolve();
            }
          ]));
        });

        await sleep({ ms: 1.25 * expirationTime });

        const { data: dataSecondTry } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          dataSecondTry.on('error', (err: any): void => {
            reject(err);
          });

          dataSecondTry.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandWithMetadata);
              assert.that(streamElement.metadata.token).is.matching(regex);

              resolve();
            }
          ]));
        });
      });

      test('delivers commands in different aggregates in parallel.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const commandOne = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleContext',
            id: v4()
          },
          name: 'execute',
          data: {}
        });
        const commandTwo = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleContext',
            id: v4()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandOne,
          discriminator: commandOne.aggregateIdentifier.id,
          priority: commandOne.metadata.timestamp
        });
        await priorityQueueStore.enqueue({
          item: commandTwo,
          discriminator: commandTwo.aggregateIdentifier.id,
          priority: commandTwo.metadata.timestamp
        });

        const { data: dataFirstTry } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { data: dataSecondTry } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          dataSecondTry.on('error', (err: any): void => {
            reject(err);
          });

          dataFirstTry.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandOne);

              resolve();
            }
          ]));
        });

        await new Promise((resolve, reject): void => {
          dataSecondTry.on('error', (err: any): void => {
            reject(err);
          });

          dataSecondTry.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandTwo);

              resolve();
            }
          ]));
        });
      });
    });

    suite('POST /renew-lock', (): void => {
      test('returns a 400 status code if a too short discriminator is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/renew-lock',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: '',
            token: v4()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
        });
      });

      test('returns a 403 status code if an unknown token is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: v4()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/renew-lock',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: commandWithMetadata.aggregateIdentifier.id,
            token: v4()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(403);
        assert.that(data).is.equalTo({
          code: errors.TokenMismatch.code,
          message: `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.id}'.`
        });
      });

      test('extends the lock expiry time.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: v4()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        const { data: lockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { metadata: { token }} = await new Promise((resolve, reject): void => {
          lockData.on('error', (err: any): void => {
            reject(err);
          });

          lockData.on('close', (): void => {
            resolve();
          });

          lockData.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              resolve(streamElement);
            }
          ]));
        });

        await sleep({ ms: 0.6 * expirationTime });

        await client({
          method: 'post',
          url: '/v2/renew-lock',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: commandWithMetadata.aggregateIdentifier.id,
            token
          }
        });

        await sleep({ ms: 0.6 * expirationTime });

        // We have now waited 1.2 * expirationTime, so if the request to
        // /renew-lock did not work, the command should be available again.
        // If the request worked, the next request to /v2/ should stay open
        // indefinitely.
        const { data: unavailableLockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise(async (resolve, reject): Promise<void> => {
          unavailableLockData.on('error', (err: any): void => {
            reject(err);
          });

          unavailableLockData.on('close', (): void => {
            reject(new Error('Stream should not have closed yet.'));
          });

          unavailableLockData.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            }
          ]));

          await sleep({ ms: pollInterval });

          resolve();
        });
      });
    });

    suite('POST /acknowledge', (): void => {
      test('returns a 400 status code if a too short discriminator is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/acknowledge',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: '',
            token: v4()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
        });
      });

      test('returns a 403 status code if an unknown token is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: v4()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/acknowledge',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: commandWithMetadata.aggregateIdentifier.id,
            token: v4()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(403);
        assert.that(data).is.equalTo({
          code: errors.TokenMismatch.code,
          message: `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.id}'.`
        });
      });

      test('removes the item from the queue and lets the next item for the same aggregate pass.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const aggregateId = v4();
        const commandOne = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          data: {}
        });
        const commandTwo = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandOne,
          discriminator: commandOne.aggregateIdentifier.id,
          priority: commandOne.metadata.timestamp
        });
        await priorityQueueStore.enqueue({
          item: commandTwo,
          discriminator: commandTwo.aggregateIdentifier.id,
          priority: commandTwo.metadata.timestamp
        });

        const { data: firstLockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { item, metadata: { token }} = await new Promise((resolve, reject): void => {
          firstLockData.on('error', (err: any): void => {
            reject(err);
          });

          firstLockData.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              resolve(streamElement);
            }
          ]));
        });

        const commandWithMetadata = new CommandWithMetadata(item);

        await client({
          method: 'post',
          url: '/v2/acknowledge',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: commandWithMetadata.aggregateIdentifier.id,
            token
          }
        });

        const { data: secondLockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          secondLockData.on('error', (err: any): void => {
            reject(err);
          });

          secondLockData.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandTwo);

              resolve();
            }
          ]));
        });
      });
    });

    suite('POST /defer', (): void => {
      test('returns a 400 status code if a too short discriminator is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/defer',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: '',
            token: v4(),
            priority: Date.now()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
        });
      });

      test('returns a 403 status code if an unknown token is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: v4()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/defer',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: commandWithMetadata.aggregateIdentifier.id,
            token: v4(),
            priority: Date.now()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(403);
        assert.that(data).is.equalTo({
          code: errors.TokenMismatch.code,
          message: `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.id}'.`
        });
      });

      test('returns a 400 status code if an invalid priority is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: v4()
          },
          name: 'execute',
          data: {}
        });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/defer',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: commandWithMetadata.aggregateIdentifier.id,
            token: v4(),
            priority: -1
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'Value -1 is less than minimum 0 (at requestBody.priority).'
        });
      });

      test('defers the item from the queue and lets the next item for the same aggregate pass.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const aggregateId = v4();
        const commandOne = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          data: {}
        });
        const commandTwo = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandOne,
          discriminator: commandOne.aggregateIdentifier.id,
          priority: commandOne.metadata.timestamp
        });
        await priorityQueueStore.enqueue({
          item: commandTwo,
          discriminator: commandTwo.aggregateIdentifier.id,
          priority: commandTwo.metadata.timestamp
        });

        const { data: firstLockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { item, metadata: { token }} = await new Promise((resolve, reject): void => {
          firstLockData.on('error', (err: any): void => {
            reject(err);
          });

          firstLockData.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              resolve(streamElement);
            }
          ]));
        });

        const commandWithMetadata = new CommandWithMetadata(item);

        await client({
          method: 'post',
          url: '/v2/defer',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: commandWithMetadata.aggregateIdentifier.id,
            token,
            priority: Date.now()
          }
        });

        const { data: secondLockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { item: nextItem, metadata: { token: nextToken }} = await new Promise((resolve, reject): void => {
          secondLockData.on('error', (err: any): void => {
            reject(err);
          });

          secondLockData.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              resolve(streamElement);
            }
          ]));
        });

        const nextCommandWithMetadata = new CommandWithMetadata(nextItem);

        await client({
          method: 'post',
          url: '/v2/acknowledge',
          headers: { 'content-type': 'application/json' },
          data: {
            discriminator: nextCommandWithMetadata.aggregateIdentifier.id,
            token: nextToken
          }
        });

        const { data: thirdLockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          thirdLockData.on('error', (err: any): void => {
            reject(err);
          });

          thirdLockData.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandOne);

              resolve();
            }
          ]));
        });
      });
    });
  });
});
