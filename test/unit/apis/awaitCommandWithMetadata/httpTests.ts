import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { getApi } from '../../../../lib/apis/awaitCommandWithMetadata/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getItemIdentifierFromCommand } from '../../../shared/getItemIdentifierFromCommand';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/InMemory';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { runAsServer } from '../../../shared/http/runAsServer';
import { sleep } from '../../../../lib/common/utils/sleep';
import { isUuid, uuid } from 'uuidv4';

suite('awaitCommandWithMetadata/http', (): void => {
  suite('/v2', function (): void {
    this.timeout(10_000);

    let api: Application,
        applicationDefinition: ApplicationDefinition,
        priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;

    setup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      applicationDefinition = await getApplicationDefinition({ applicationDirectory });

      priorityQueueStore = await InMemoryPriorityQueueStore.create({
        expirationTime: 5_000
      });

      ({ api } = await getApi({
        applicationDefinition,
        corsOrigin: '*',
        priorityQueueStore
      }));
    });

    suite('GET /', (): void => {
      test('returns the status code 200.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns the content-type application/x-ndjson.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { headers } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
      });

      test('leaves the connection open indefiniteley as long as no command is enqueued.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

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

          data.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            }
          ));

          await sleep({ ms: 5_000 });

          resolve();
        });
      });

      test('keeps the connection open and delivers a command, then closes.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const commandWithMetadata = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandWithMetadata);
              assert.that(isUuid(streamElement.token)).is.true();
            }
          ));
        });
      });

      test('redelivers the same command if the timeout expires.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const commandWithMetadata = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleContext',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });

        const { data: dataFirstTry } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve): void => {
          dataFirstTry.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandWithMetadata);
              assert.that(isUuid(streamElement.token)).is.true();

              resolve();
            }
          ));
        });

        await sleep({ ms: 5_000 });

        const { data: dataSecondTry } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          dataSecondTry.on('error', (err: any): void => {
            reject(err);
          });

          dataSecondTry.on('close', (): void => {
            resolve();
          });

          dataSecondTry.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandWithMetadata);
              assert.that(isUuid(streamElement.token)).is.true();
            }
          ));
        });
      });

      test('delivers a locked command to the next waiting client after the lock expires.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const commandWithMetadata = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleContext',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });

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

          dataFirstTry.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandWithMetadata);

              resolve();
            }
          ));
        });

        await new Promise((resolve, reject): void => {
          dataSecondTry.on('error', (err: any): void => {
            reject(err);
          });

          dataSecondTry.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandWithMetadata);
              assert.that(isUuid(streamElement.token)).is.true();

              resolve();
            }
          ));
        });
      });

      test('delivers commands in different aggregates in parallel.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const commandOne = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleContext',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });
        const commandTwo = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleContext',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandOne });
        await priorityQueueStore.enqueue({ item: commandTwo });

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

          dataFirstTry.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandOne);

              resolve();
            }
          ));
        });

        await new Promise((resolve, reject): void => {
          dataSecondTry.on('error', (err: any): void => {
            reject(err);
          });

          dataSecondTry.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandTwo);

              resolve();
            }
          ));
        });
      });
    });

    suite('POST /renew-lock', (): void => {
      test('returns a 400 status code if an invalid item identifier is sent.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/renew-lock',
          headers: { 'content-type': 'application/json' },
          data: {
            itemIdentifier: {},
            token: uuid()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo('Missing required property: contextIdentifier (at itemIdentifier.contextIdentifier).');
      });

      test('returns a 400 status code if an invalid token is sent.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const commandWithMetadata = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });

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
            itemIdentifier: getItemIdentifierFromCommand(commandWithMetadata),
            token: 'not-a-uuid'
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo('Expected token to be a uuidv4.');
      });

      test('returns a 400 status code if an unknown token is sent.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const commandWithMetadata = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });

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
            itemIdentifier: getItemIdentifierFromCommand(commandWithMetadata),
            token: uuid()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Token mismatch for item 'sampleContext.sampleAggregate.${commandWithMetadata.aggregateIdentifier.id}.execute.${commandWithMetadata.id}'.`);
      });

      test('extends the lock expiry time.', async function (): Promise<void> {
        this.timeout(15_000);

        const client = await runAsServer({ app: api });

        const commandWithMetadata = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });

        const { data: lockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { token } = await new Promise((resolve, reject): void => {
          lockData.on('error', (err: any): void => {
            reject(err);
          });

          lockData.on('close', (): void => {
            resolve();
          });

          lockData.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              resolve(streamElement);
            }
          ));
        });

        await sleep({ ms: 3_000 });

        await client({
          method: 'post',
          url: '/v2/renew-lock',
          headers: { 'content-type': 'application/json' },
          data: {
            itemIdentifier: getItemIdentifierFromCommand(commandWithMetadata),
            token
          }
        });

        await sleep({ ms: 3_000 });

        // Since the only queued Command should still be locked, the next
        // request to /v2/ should stay open indefinitely.
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

          unavailableLockData.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            }
          ));

          await sleep({ ms: 5_000 });

          resolve();
        });
      });
    });

    suite('POST /acknowledge', (): void => {
      test('returns a 400 status code if an invalid item identifier is sent.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/acknowledge',
          headers: { 'content-type': 'application/json' },
          data: {
            itemIdentifier: {},
            token: uuid()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo('Missing required property: contextIdentifier (at itemIdentifier.contextIdentifier).');
      });

      test('returns a 400 status code if an invalid token is sent.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const commandWithMetadata = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });

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
            itemIdentifier: getItemIdentifierFromCommand(commandWithMetadata),
            token: 'not-a-uuid'
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo('Expected token to be a uuidv4.');
      });

      test('returns a 400 status code if an unknown token is sent.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const commandWithMetadata = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandWithMetadata });

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
            itemIdentifier: getItemIdentifierFromCommand(commandWithMetadata),
            token: uuid()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Token mismatch for item 'sampleContext.sampleAggregate.${commandWithMetadata.aggregateIdentifier.id}.execute.${commandWithMetadata.id}'.`);
      });

      test('removes the item from the queue and lets the next item for the same aggregate pass.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const aggregateId = uuid();
        const commandOne = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });
        const commandTwo = new CommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          id: uuid(),
          data: {},
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        await priorityQueueStore.enqueue({ item: commandOne });
        await priorityQueueStore.enqueue({ item: commandTwo });

        const { data: firstLockData } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        const { item: firstItem, token: firstToken } = await new Promise((resolve, reject): void => {
          firstLockData.on('error', (err: any): void => {
            reject(err);
          });

          firstLockData.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              resolve(streamElement);
            }
          ));
        });

        await client({
          method: 'post',
          url: '/v2/acknowledge',
          headers: { 'content-type': 'application/json' },
          data: {
            itemIdentifier: getItemIdentifierFromCommand(firstItem),
            token: firstToken
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

          secondLockData.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.item).is.equalTo(commandTwo);

              resolve();
            }
          ));
        });
      });
    });
  });
});
