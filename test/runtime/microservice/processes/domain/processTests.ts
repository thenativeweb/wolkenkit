import { AggregateIdentifier } from '../../../../../lib/common/elements/AggregateIdentifier';
import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { Client as AwaitDomainEventClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { buildCommandWithMetadata } from '../../../../../lib/common/utils/test/buildCommandWithMetadata';
import { Configuration as CommandDispatcherConfiguration } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/Configuration';
import { configurationDefinition as commandDispatcherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition';
import { Configuration as DomainConfiguration } from '../../../../../lib/runtimes/microservice/processes/domain/Configuration';
import { configurationDefinition as domainConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domain/configurationDefinition';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../../lib/common/elements/DomainEventData';
import { Configuration as DomainEventDispatcherConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/Configuration';
import { configurationDefinition as domainEventDispatcherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/configurationDefinition';
import { Configuration as DomainEventStoreConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/Configuration';
import { configurationDefinition as domainEventStoreConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getSocketPaths } from '../../../../shared/getSocketPaths';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleCommandWithMetadataClient } from '../../../../../lib/apis/handleCommandWithMetadata/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Configuration as PublisherConfiguration } from '../../../../../lib/runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition';
import { Client as QueryDomainEventStoreClient } from '../../../../../lib/apis/queryDomainEventStore/http/v2/Client';
import { SnapshotStrategyConfiguration } from '../../../../../lib/common/domain/SnapshotStrategyConfiguration';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { Client as SubscribeMessagesClient } from '../../../../../lib/apis/subscribeMessages/http/v2/Client';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';

suite('domain process', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const publisherChannelNewDomainEvent = 'newDomainEvent',
        publisherChannelNotification = 'notifications',
        queueLockExpirationTime = 600,
        queuePollInterval = 600;

  let commandDispatcherHealthSocket: string,
      commandDispatcherSocket: string,
      domainEventDispatcherHealthSocket: string,
      domainEventDispatcherSocket: string,
      domainEventStoreHealthSocket: string,
      domainEventStoreSocket: string,
      domainHealthSocket: string,
      handleCommandWithMetadataClient: HandleCommandWithMetadataClient,
      publisherHealthSocket: string,
      publisherSocket: string,
      queryDomainEventStoreClient: QueryDomainEventStoreClient,
      stopCommandDispatcherProcess: (() => Promise<void>) | undefined,
      stopDomainEventDispatcherProcess: (() => Promise<void>) | undefined,
      stopDomainEventStoreProcess: (() => Promise<void>) | undefined,
      stopDomainProcess: (() => Promise<void>) | undefined,
      stopPublisherProcess: (() => Promise<void>) | undefined,
      subscribeMessagesClient: SubscribeMessagesClient;

  setup(async (): Promise<void> => {
    [
      commandDispatcherSocket,
      commandDispatcherHealthSocket,
      domainEventDispatcherSocket,
      domainEventDispatcherHealthSocket,
      domainEventStoreSocket,
      domainEventStoreHealthSocket,
      domainHealthSocket,
      publisherSocket,
      publisherHealthSocket
    ] = await getSocketPaths({ count: 9 });

    const commandDispatcherConfiguration: CommandDispatcherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: commandDispatcherConfigurationDefinition }),
      applicationDirectory,
      priorityQueueStoreOptions: { type: 'InMemory', expirationTime: queueLockExpirationTime },
      portOrSocket: commandDispatcherSocket,
      healthPortOrSocket: commandDispatcherHealthSocket,
      missedCommandRecoveryInterval: queuePollInterval
    };

    stopCommandDispatcherProcess = await startProcess({
      runtime: 'microservice',
      name: 'commandDispatcher',
      enableDebugMode: false,
      portOrSocket: commandDispatcherHealthSocket,
      env: toEnvironmentVariables({
        configuration: commandDispatcherConfiguration,
        configurationDefinition: commandDispatcherConfigurationDefinition
      })
    });

    handleCommandWithMetadataClient = new HandleCommandWithMetadataClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: commandDispatcherSocket,
      path: '/handle-command/v2'
    });

    const domainEventDispatcherConfiguration: DomainEventDispatcherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainEventDispatcherConfigurationDefinition }),
      applicationDirectory,
      priorityQueueStoreOptions: { type: 'InMemory', expirationTime: queueLockExpirationTime },
      portOrSocket: domainEventDispatcherSocket,
      healthPortOrSocket: domainEventDispatcherHealthSocket,
      missedDomainEventRecoveryInterval: queuePollInterval
    };

    stopDomainEventDispatcherProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEventDispatcher',
      enableDebugMode: false,
      portOrSocket: domainEventDispatcherHealthSocket,
      env: toEnvironmentVariables({
        configuration: domainEventDispatcherConfiguration,
        configurationDefinition: domainEventDispatcherConfigurationDefinition
      })
    });

    const domainEventStoreConfiguration: DomainEventStoreConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainEventStoreConfigurationDefinition }),
      portOrSocket: domainEventStoreSocket,
      healthPortOrSocket: domainEventStoreHealthSocket
    };

    stopDomainEventStoreProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      enableDebugMode: false,
      portOrSocket: domainEventStoreHealthSocket,
      env: toEnvironmentVariables({
        configuration: domainEventStoreConfiguration,
        configurationDefinition: domainEventStoreConfigurationDefinition
      })
    });

    queryDomainEventStoreClient = new QueryDomainEventStoreClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: domainEventStoreSocket,
      path: '/query/v2'
    });

    const publisherConfiguration: PublisherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: publisherConfigurationDefinition }),
      portOrSocket: publisherSocket,
      healthPortOrSocket: publisherHealthSocket
    };

    stopPublisherProcess = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      portOrSocket: publisherHealthSocket,
      env: toEnvironmentVariables({
        configuration: publisherConfiguration,
        configurationDefinition: publisherConfigurationDefinition
      })
    });

    subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: publisherSocket,
      path: '/subscribe/v2'
    });

    const domainConfiguration: DomainConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainConfigurationDefinition }),
      applicationDirectory,
      commandDispatcherHostName: 'localhost',
      commandDispatcherPortOrSocket: commandDispatcherSocket,
      commandDispatcherRenewInterval: 5_000,
      commandDispatcherAcknowledgeRetries: 0,
      domainEventDispatcherHostName: 'localhost',
      domainEventDispatcherPortOrSocket: domainEventDispatcherSocket,
      pubSubOptions: {
        channelForNotifications: publisherChannelNotification,
        channelForNewDomainEvents: publisherChannelNewDomainEvent,
        publisher: {
          type: 'Http',
          protocol: 'http',
          hostName: 'localhost',
          portOrSocket: publisherSocket,
          path: '/publish/v2'
        }
      },
      aeonstoreHostName: 'localhost',
      aeonstorePortOrSocket: domainEventStoreSocket,
      healthPortOrSocket: domainHealthSocket,
      concurrentCommands: 1,
      snapshotStrategy: { name: 'never' } as SnapshotStrategyConfiguration
    };

    stopDomainProcess = await startProcess({
      runtime: 'microservice',
      name: 'domain',
      enableDebugMode: false,
      portOrSocket: domainHealthSocket,
      env: toEnvironmentVariables({
        configuration: domainConfiguration,
        configurationDefinition: domainConfigurationDefinition
      })
    });
  });

  teardown(async (): Promise<void> => {
    if (stopCommandDispatcherProcess) {
      await stopCommandDispatcherProcess();
    }
    if (stopDomainEventDispatcherProcess) {
      await stopDomainEventDispatcherProcess();
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

    stopCommandDispatcherProcess = undefined;
    stopDomainEventDispatcherProcess = undefined;
    stopDomainEventStoreProcess = undefined;
    stopPublisherProcess = undefined;
    stopDomainProcess = undefined;
  });

  suite('getHealth', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new HealthClient({
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: domainHealthSocket,
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
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: v4()
        }
      };

      const command = buildCommandWithMetadata({
        aggregateIdentifier,
        name: 'authorize',
        data: {
          shouldAuthorize: false
        }
      });

      const messageStream = await subscribeMessagesClient.getMessages({
        channel: publisherChannelNewDomainEvent
      });

      await handleCommandWithMetadataClient.postCommand({ command });

      await new Promise<void>((resolve, reject): void => {
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
                  aggregateIdentifier,
                  name: 'authorizeRejected',
                  data: {
                    reason: 'Command not authorized.'
                  }
                });
                resolve();
              } catch (ex: unknown) {
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
      const aggregateIdentifier: AggregateIdentifier = {
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: v4()
        }
      };

      const command = buildCommandWithMetadata({
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      const messageStreamNewDomainEvent = await subscribeMessagesClient.getMessages({
        channel: publisherChannelNewDomainEvent
      });

      await handleCommandWithMetadataClient.postCommand({ command });

      await new Promise<void>((resolve, reject): void => {
        messageStreamNewDomainEvent.on('error', (err: any): void => {
          reject(err);
        });
        messageStreamNewDomainEvent.on('close', (): void => {
          resolve();
        });
        messageStreamNewDomainEvent.pipe(asJsonStream(
          [
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex: unknown) {
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

      const awaitDomainEventClient = new AwaitDomainEventClient<DomainEvent<DomainEventData>>({
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: domainEventDispatcherSocket,
        path: '/await-domain-event/v2',
        createItemInstance: ({ item }): DomainEvent<DomainEventData> => new DomainEvent<DomainEventData>(item)
      });

      let { item, metadata } = await awaitDomainEventClient.awaitItem();

      assert.that(item).is.atLeast({
        aggregateIdentifier,
        name: 'succeeded',
        data: {}
      });

      await awaitDomainEventClient.acknowledge({
        discriminator: metadata.discriminator,
        token: metadata.token
      });

      ({ item, metadata } = await awaitDomainEventClient.awaitItem());

      assert.that(item).is.atLeast({
        aggregateIdentifier,
        name: 'executed',
        data: {
          strategy: 'succeed'
        }
      });

      await awaitDomainEventClient.acknowledge({
        discriminator: metadata.discriminator,
        token: metadata.token
      });

      const eventStream = await queryDomainEventStoreClient.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });

      await new Promise<void>((resolve, reject): void => {
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
                  aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex: unknown) {
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
        aggregateIdentifier: {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        },
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });
      const command2 = buildCommandWithMetadata({
        aggregateIdentifier: {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        },
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      const messageStream = await subscribeMessagesClient.getMessages({
        channel: publisherChannelNewDomainEvent
      });

      await handleCommandWithMetadataClient.postCommand({ command: command1 });
      await handleCommandWithMetadataClient.postCommand({ command: command2 });

      await new Promise<void>((resolve, reject): void => {
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
                  aggregateIdentifier: command1.aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  aggregateIdentifier: command1.aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  aggregateIdentifier: command2.aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  aggregateIdentifier: command2.aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex: unknown) {
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

    test('publishes notifications from command handlers.', async (): Promise<void> => {
      const aggregateIdentifier: AggregateIdentifier = {
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: v4()
        }
      };

      const command = buildCommandWithMetadata({
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      const messageStreamNotification = await subscribeMessagesClient.getMessages({
        channel: publisherChannelNotification
      });

      await handleCommandWithMetadataClient.postCommand({ command });

      await new Promise<void>((resolve, reject): void => {
        messageStreamNotification.on('error', (err: any): void => {
          reject(err);
        });
        messageStreamNotification.on('close', (): void => {
          resolve();
        });
        messageStreamNotification.pipe(asJsonStream(
          [
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  name: 'commandExecute',
                  data: {}
                });
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            }
          ],
          true
        ));
      });
    });
  });
});
