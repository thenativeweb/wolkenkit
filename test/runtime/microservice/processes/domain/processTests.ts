import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../../shared/buildCommandWithMetadata';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleCommandWithMetadataClient } from '../../../../../lib/apis/handleCommandWithMetadata/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import path from 'path';
import { Client as QueryDomainEventStoreClient } from '../../../../../lib/apis/queryDomainEventStore/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { Client as SubscribeMessagesClient } from '../../../../../lib/apis/subscribeMessages/http/v2/Client';
import { uuid } from 'uuidv4';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('domain', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const queueLockExpirationTime = 600;
  const queuePollInterval = 600;

  let dispatcherHealthPort: number,
      dispatcherPort: number,
      domainEventStoreHealthPort: number,
      domainEventStorePort: number,
      domainHealthPort: number,
      handleCommandWithMetadataClient: HandleCommandWithMetadataClient,
      publisherHealthPort: number,
      publisherPort: number,
      queryDomainEventStoreClient: QueryDomainEventStoreClient,
      stopDispatcherProcess: (() => Promise<void>) | undefined,
      stopDomainEventStoreProcess: (() => Promise<void>) | undefined,
      stopDomainProcess: (() => Promise<void>) | undefined,
      stopPublisherProcess: (() => Promise<void>) | undefined,
      subscribeMessagesClient: SubscribeMessagesClient;

  setup(async (): Promise<void> => {
    [
      dispatcherPort,
      dispatcherHealthPort,
      domainEventStorePort,
      domainEventStoreHealthPort,
      domainHealthPort,
      publisherPort,
      publisherHealthPort
    ] = await getAvailablePorts({ count: 7 });

    stopDispatcherProcess = await startProcess({
      runtime: 'microservice',
      name: 'dispatcher',
      enableDebugMode: false,
      port: dispatcherHealthPort,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":${queueLockExpirationTime}}`,
        PORT: String(dispatcherPort),
        HEALTH_PORT: String(dispatcherHealthPort),
        IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`,
        QUEUE_POLL_INTERVAL: String(queuePollInterval)
      }
    });

    handleCommandWithMetadataClient = new HandleCommandWithMetadataClient({
      protocol: 'http',
      hostName: 'localhost',
      port: dispatcherPort,
      path: '/handle-command/v2'
    });

    stopDomainEventStoreProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      enableDebugMode: false,
      port: domainEventStoreHealthPort,
      env: {
        PORT: String(domainEventStorePort),
        HEALTH_PORT: String(domainEventStoreHealthPort)
      }
    });

    queryDomainEventStoreClient = new QueryDomainEventStoreClient({
      protocol: 'http',
      hostName: 'localhost',
      port: domainEventStorePort,
      path: '/query/v2'
    });

    stopPublisherProcess = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      port: publisherHealthPort,
      env: {
        PORT: String(publisherPort),
        HEALTH_PORT: String(publisherHealthPort)
      }
    });

    subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: 'http',
      hostName: 'localhost',
      port: publisherPort,
      path: '/subscribe/v2'
    });

    stopDomainProcess = await startProcess({
      runtime: 'microservice',
      name: 'domain',
      enableDebugMode: false,
      port: domainHealthPort,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        DISPATCHER_PROTOCOL: 'http',
        DISPATCHER_HOST_NAME: 'localhost',
        DISPATCHER_PORT: String(dispatcherPort),
        DISPATCHER_RENEW_INTERVAL: String(5_000),
        DISPATCHER_ACKNOWLEDGE_RETRIES: String(0),
        PUBLISHER_PROTOCOL: 'http',
        PUBLISHER_HOST_NAME: 'localhost',
        PUBLISHER_PORT: String(publisherPort),
        AEONSTORE_PROTOCOL: 'http',
        AEONSTORE_HOST_NAME: 'localhost',
        AEONSTORE_PORT: String(domainEventStorePort),
        AEONSTORE_RETRIES: String(0),
        HEALTH_PORT: String(domainHealthPort),
        CONCURRENT_COMMANDS: String(1),
        SNAPSHOT_STRATEGY: `{"name":"never"}`
      }
    });
  });

  teardown(async (): Promise<void> => {
    if (stopDispatcherProcess) {
      await stopDispatcherProcess();
    }
    if (stopDomainEventStoreProcess) {
      await stopDomainEventStoreProcess();
    }
    if (stopPublisherProcess) {
      await stopPublisherProcess();
    }
    if (stopDomainProcess) {
      await stopDomainProcess();
    }

    stopDispatcherProcess = undefined;
    stopDomainEventStoreProcess = undefined;
    stopPublisherProcess = undefined;
    stopDomainProcess = undefined;
  });

  suite('getHealth', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new HealthClient({
        protocol: 'http',
        hostName: 'localhost',
        port: domainHealthPort,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('authorization', (): void => {
    test(`publishes (and does not store) a rejected event if the sender of a command is not authorized.`, async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: uuid()
      };

      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'authorize',
        data: {
          shouldAuthorize: false
        }
      });

      const messageStream = await subscribeMessagesClient.getMessages();

      await handleCommandWithMetadataClient.postCommand({ command });

      await new Promise((resolve, reject): void => {
        messageStream.on('error', (err: any): void => {
          reject(err);
        });
        messageStream.on('close', (): void => {
          resolve();
        });
        messageStream.pipe(asJsonStream(
          [
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'authorizeRejected',
                  data: {
                    reason: 'Command not authorized.'
                  }
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (): void => {
              reject(new Error('Should only have received one message.'));
            }
          ],
          true
        ));
      });

      assert.that(
        await queryDomainEventStoreClient.getLastDomainEvent({ aggregateIdentifier })
      ).is.undefined();
    });
  });

  suite('handling', (): void => {
    test('publishes (and stores) an appropriate event for the incoming command.', async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: uuid()
      };

      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      const messageStream = await subscribeMessagesClient.getMessages();

      await handleCommandWithMetadataClient.postCommand({ command });

      await new Promise((resolve, reject): void => {
        messageStream.on('error', (err: any): void => {
          reject(err);
        });
        messageStream.on('close', (): void => {
          resolve();
        });
        messageStream.pipe(asJsonStream(
          [
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (): void => {
              reject(new Error('Should only have received two messages.'));
            }
          ],
          true
        ));
      });

      const eventStream = await queryDomainEventStoreClient.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });

      await new Promise((resolve, reject): void => {
        eventStream.on('error', (err: any): void => {
          reject(err);
        });
        eventStream.on('close', (): void => {
          resolve();
        });
        eventStream.pipe(asJsonStream(
          [
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (): void => {
              reject(new Error('Should only have received two messages.'));
            }
          ],
          true
        ));
      });
    });

    test('handles multiple events in independent aggregates after each other.', async (): Promise<void> => {
      const command1 = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });
      const command2 = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      const messageStream = await subscribeMessagesClient.getMessages();

      await handleCommandWithMetadataClient.postCommand({ command: command1 });
      await handleCommandWithMetadataClient.postCommand({ command: command2 });

      await new Promise((resolve, reject): void => {
        messageStream.on('error', (err: any): void => {
          reject(err);
        });
        messageStream.on('close', (): void => {
          resolve();
        });
        messageStream.pipe(asJsonStream(
          [
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier: command1.aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier: command1.aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier: command2.aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier: command2.aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (): void => {
              reject(new Error('Should only have received four messages.'));
            }
          ],
          true
        ));
      });
    });
  });
});
