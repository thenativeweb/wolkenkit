import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../shared/buildCommandWithMetadata';
import { Client } from '../../../../lib/apis/awaitCommandWithMetadata/http/v2/Client';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { getApi } from '../../../../lib/apis/awaitCommandWithMetadata/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getPromiseStatus } from '../../../../lib/common/utils/getPromiseStatus';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/InMemory';
import { InMemoryPublisher } from '../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher';
import { InMemorySubscriber } from '../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { runAsServer } from '../../../shared/http/runAsServer';
import { sleep } from '../../../../lib/common/utils/sleep';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { uuid } from 'uuidv4';

suite('awaitCommandWithMetadata/http/Client', (): void => {
  suite('/v2', (): void => {
    const expirationTime = 600;
    const pollInterval = 500;

    let api: Application,
        applicationDefinition: ApplicationDefinition,
        newCommandPublisher: Publisher<object>,
        newCommandSubscriber: Subscriber<object>,
        newCommandSubscriberChannel: string,
        priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;

    setup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      applicationDefinition = await getApplicationDefinition({ applicationDirectory });

      newCommandSubscriber = await InMemorySubscriber.create();
      newCommandSubscriberChannel = uuid();
      newCommandPublisher = await InMemoryPublisher.create();

      priorityQueueStore = await InMemoryPriorityQueueStore.create({
        expirationTime
      });

      ({ api } = await getApi({
        applicationDefinition,
        corsOrigin: '*',
        priorityQueueStore,
        newCommandSubscriber,
        newCommandSubscriberChannel
      }));
    });

    suite('awaitCommandWithMetadata', (): void => {
      test('retrieves a lock item.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });
        await newCommandPublisher.publish({
          channel: newCommandSubscriberChannel,
          message: {}
        });

        const command = await client.awaitCommandWithMetadata();

        assert.that(command.item).is.equalTo(commandWithMetadata);
        assert.that(command.token).is.ofType('string');
      });
    });

    suite('renewLock', (): void => {
      test('throws an item identifier malformed error if the item identifier is malformed.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.renewLock({
          itemIdentifier: {} as any,
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMIDENTIFIERMALFORMED' &&
            ex.message === 'Missing required property: contextIdentifier (at itemIdentifier.contextIdentifier).'
        );
      });

      test(`throws an item not found error if the item doesn't exist.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => client.renewLock({
          itemIdentifier: {
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier: {
              name: 'sampleAggregate',
              id: uuid()
            },
            id: uuid(),
            name: 'foo'
          },
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTFOUND'
        );
      });

      test(`throws an item not locked error if the item isn't locked.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });
        await newCommandPublisher.publish({
          channel: newCommandSubscriberChannel,
          message: {}
        });

        await assert.that(async (): Promise<any> => client.renewLock({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTLOCKED'
        );
      });

      test(`throws a token mismatched error if the token doesn't match.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });
        await newCommandPublisher.publish({
          channel: newCommandSubscriberChannel,
          message: {}
        });

        await client.awaitCommandWithMetadata();

        await assert.that(async (): Promise<any> => client.renewLock({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'ETOKENMISMATCH' &&
            ex.message === `Token mismatch for item 'sampleContext.sampleAggregate.${commandWithMetadata.aggregateIdentifier.id}.execute.${commandWithMetadata.id}'.`
        );
      });

      test('extends the lock expiry time.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });
        await newCommandPublisher.publish({
          channel: newCommandSubscriberChannel,
          message: {}
        });

        const { item, token } = await client.awaitCommandWithMetadata();

        await sleep({ ms: 0.6 * expirationTime });

        await client.renewLock({ itemIdentifier: item.getItemIdentifier(), token });

        await sleep({ ms: 0.6 * expirationTime });

        const notResolvingPromise = client.awaitCommandWithMetadata();

        await sleep({ ms: pollInterval });

        assert.that(await getPromiseStatus(notResolvingPromise)).is.equalTo('pending');
      });
    });

    suite('acknowledge', (): void => {
      test('throws an item identifier malformed error if the item identifier is malformed.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.acknowledge({
          itemIdentifier: {} as any,
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMIDENTIFIERMALFORMED' &&
            ex.message === 'Missing required property: contextIdentifier (at itemIdentifier.contextIdentifier).'
        );
      });

      test(`throws an item not found error if the item doesn't exist.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => client.acknowledge({
          itemIdentifier: {
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier: {
              name: 'sampleAggregate',
              id: uuid()
            },
            id: uuid(),
            name: 'foo'
          },
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTFOUND'
        );
      });

      test(`throws an item not locked error if the item isn't locked.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });
        await newCommandPublisher.publish({
          channel: newCommandSubscriberChannel,
          message: {}
        });

        await assert.that(async (): Promise<any> => client.acknowledge({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTLOCKED'
        );
      });

      test(`throws a token mismatched error if the token doesn't match.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });
        await newCommandPublisher.publish({
          channel: newCommandSubscriberChannel,
          message: {}
        });

        await client.awaitCommandWithMetadata();

        await assert.that(async (): Promise<any> => client.acknowledge({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'ETOKENMISMATCH' &&
            ex.message === `Token mismatch for item 'sampleContext.sampleAggregate.${commandWithMetadata.aggregateIdentifier.id}.execute.${commandWithMetadata.id}'.`
        );
      });

      test('removes the item from the queue and lets the next item for the same aggregate pass.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const aggregateId = uuid();
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

        await priorityQueueStore.enqueue({ item: commandOne });
        await priorityQueueStore.enqueue({ item: commandTwo });

        const { item, token } = await client.awaitCommandWithMetadata();

        const commandWithMetadata = new CommandWithMetadata(item);

        await client.acknowledge({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token
        });

        // This should resolve. A timeout in this test means, that this can not
        // fetch a command.
        await client.awaitCommandWithMetadata();
      });
    });
  });
});
