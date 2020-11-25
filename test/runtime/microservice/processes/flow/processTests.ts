import { Client as AeonstoreClient } from '../../../../../lib/apis/writeDomainEventStore/http/v2/Client';
import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { CommandData } from '../../../../../lib/common/elements/CommandData';
import { Client as CommandDispatcherClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { Configuration as CommandDispatcherConfiguration } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/Configuration';
import { configurationDefinition as commandDispatcherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition';
import { CommandWithMetadata } from '../../../../../lib/common/elements/CommandWithMetadata';
import { Configuration as DomainEventDispatcherConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/Configuration';
import { configurationDefinition as domainEventDispatcherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/configurationDefinition';
import { Configuration as DomainEventStoreConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/Configuration';
import { configurationDefinition as domainEventStoreConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition';
import { Configuration as FlowConfiguration } from '../../../../../lib/runtimes/microservice/processes/flow/Configuration';
import { configurationDefinition as flowConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/flow/configurationDefinition';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleDomainEventClient } from '../../../../../lib/apis/handleDomainEvent/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Configuration as PublisherConfiguration } from '../../../../../lib/runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition';
import { Configuration as ReplayConfiguration } from '../../../../../lib/runtimes/microservice/processes/replay/Configuration';
import { configurationDefinition as replayConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/replay/configurationDefinition';
import { sleep } from '../../../../../lib/common/utils/sleep';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { Client as SubscribeMessagesClient } from '../../../../../lib/apis/subscribeMessages/http/v2/Client';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';

suite('flow server', function (): void {
  this.timeout(60_000);

  const pubsubChannelForNotifications = 'notification';

  let aeonstoreClient: AeonstoreClient,
      applicationDirectory: string,
      commandDispatcherClient: CommandDispatcherClient<CommandWithMetadata<CommandData>>,
      handleDomainEventClient: HandleDomainEventClient,
      healthPort: number,
      healthPortAeonstore: number,
      healthPortCommandDispatcher: number,
      healthPortDomainEventDispatcher: number,
      healthPortPublisher: number,
      healthPortReplay: number,
      portAeonstore: number,
      portCommandDispatcher: number,
      portDomainEventDispatcher: number,
      portPublisher: number,
      portReplay: number,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessAeonstore: (() => Promise<void>) | undefined,
      stopProcessCommandDispatcher: (() => Promise<void>) | undefined,
      stopProcessDomainEventDispatcher: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined,
      stopReplayServer: (() => Promise<void>) | undefined,
      subscribeMessagesClient: SubscribeMessagesClient;

  setup(async (): Promise<void> => {
    applicationDirectory = getTestApplicationDirectory({ name: 'withComplexFlow', language: 'javascript' });

    [
      healthPort,
      portCommandDispatcher,
      healthPortCommandDispatcher,
      portDomainEventDispatcher,
      healthPortDomainEventDispatcher,
      portReplay,
      healthPortReplay,
      portAeonstore,
      healthPortAeonstore,
      portPublisher,
      healthPortPublisher
    ] = await getAvailablePorts({ count: 11 });

    const commandDispatcherConfiguration: CommandDispatcherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: commandDispatcherConfigurationDefinition }),
      applicationDirectory,
      priorityQueueStoreOptions: { type: 'InMemory', expirationTime: 5_000 },
      port: portCommandDispatcher,
      healthPort: healthPortCommandDispatcher
    };

    stopProcessCommandDispatcher = await startProcess({
      runtime: 'microservice',
      name: 'commandDispatcher',
      enableDebugMode: false,
      port: healthPortCommandDispatcher,
      env: toEnvironmentVariables({
        configuration: commandDispatcherConfiguration,
        configurationDefinition: commandDispatcherConfigurationDefinition
      })
    });

    commandDispatcherClient = new CommandDispatcherClient<CommandWithMetadata<CommandData>>({
      protocol: 'http',
      hostName: 'localhost',
      port: portCommandDispatcher,
      path: '/await-command/v2',
      createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
    });

    const domainEventDispatcherConfiguration: DomainEventDispatcherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainEventDispatcherConfigurationDefinition }),
      applicationDirectory,
      priorityQueueStoreOptions: { type: 'InMemory', expirationTime: 5_000 },
      port: portDomainEventDispatcher,
      healthPort: healthPortDomainEventDispatcher
    };

    stopProcessDomainEventDispatcher = await startProcess({
      runtime: 'microservice',
      name: 'domainEventDispatcher',
      enableDebugMode: false,
      port: healthPortDomainEventDispatcher,
      env: toEnvironmentVariables({
        configuration: domainEventDispatcherConfiguration,
        configurationDefinition: domainEventDispatcherConfigurationDefinition
      })
    });

    handleDomainEventClient = new HandleDomainEventClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portDomainEventDispatcher,
      path: '/handle-domain-event/v2'
    });

    const replayConfiguration: ReplayConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: replayConfigurationDefinition }),
      applicationDirectory,
      domainEventDispatcherHostName: 'localhost',
      domainEventDispatcherPort: portDomainEventDispatcher,
      aeonstoreHostName: 'localhost',
      aeonstorePort: portAeonstore,
      port: portReplay,
      healthPort: healthPortReplay
    };

    stopReplayServer = await startProcess({
      runtime: 'microservice',
      name: 'replay',
      enableDebugMode: false,
      port: healthPortReplay,
      env: toEnvironmentVariables({
        configuration: replayConfiguration,
        configurationDefinition: replayConfigurationDefinition
      })
    });

    const domainEventStoreConfiguration: DomainEventStoreConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainEventStoreConfigurationDefinition }),
      port: portAeonstore,
      healthPort: healthPortAeonstore
    };

    stopProcessAeonstore = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      enableDebugMode: false,
      port: healthPortAeonstore,
      env: toEnvironmentVariables({
        configuration: domainEventStoreConfiguration,
        configurationDefinition: domainEventStoreConfigurationDefinition
      })
    });

    aeonstoreClient = new AeonstoreClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portAeonstore,
      path: '/write/v2'
    });

    const publisherConfiguration: PublisherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: publisherConfigurationDefinition }),
      port: portPublisher,
      healthPort: healthPortPublisher
    };

    stopProcessPublisher = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      port: healthPortPublisher,
      env: toEnvironmentVariables({
        configuration: publisherConfiguration,
        configurationDefinition: publisherConfigurationDefinition
      })
    });

    subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portPublisher,
      path: '/subscribe/v2'
    });

    const flowConfiguration: FlowConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: flowConfigurationDefinition }),
      applicationDirectory,
      domainEventDispatcherHostName: 'localhost',
      domainEventDispatcherPort: portDomainEventDispatcher,
      domainEventDispatcherRenewInterval: 5_000,
      domainEventDispatcherAcknowledgeRetries: 5,
      commandDispatcherHostName: 'localhost',
      commandDispatcherPort: portCommandDispatcher,
      replayServerHostName: 'localhost',
      replayServerPort: portReplay,
      aeonstoreHostName: 'localhost',
      aeonstorePort: portAeonstore,
      lockStoreOptions: { type: 'InMemory' },
      consumerProgressStoreOptions: { type: 'InMemory' },
      healthPort,
      concurrentFlows: 1,
      pubSubOptions: {
        channelForNotifications: pubsubChannelForNotifications,
        publisher: {
          type: 'Http',
          protocol: 'http',
          hostName: 'localhost',
          port: portPublisher,
          path: '/publish/v2'
        }
      }
    };

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'flow',
      enableDebugMode: false,
      port: healthPort,
      env: toEnvironmentVariables({
        configuration: flowConfiguration,
        configurationDefinition: flowConfigurationDefinition
      })
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }
    if (stopProcessPublisher) {
      await stopProcessPublisher();
    }
    if (stopProcessAeonstore) {
      await stopProcessAeonstore();
    }
    if (stopReplayServer) {
      await stopReplayServer();
    }
    if (stopProcessDomainEventDispatcher) {
      await stopProcessDomainEventDispatcher();
    }
    if (stopProcessCommandDispatcher) {
      await stopProcessCommandDispatcher();
    }

    stopProcess = undefined;
    stopProcessPublisher = undefined;
    stopProcessAeonstore = undefined;
    stopReplayServer = undefined;
    stopProcessCommandDispatcher = undefined;
    stopProcessDomainEventDispatcher = undefined;
  });

  suite('getHealth', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new HealthClient({
        protocol: 'http',
        hostName: 'localhost',
        port: healthPort,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('executes flow', (): void => {
    test('for a domain received via the domain event dispatcher.', async (): Promise<void> => {
      const aggregateId = v4();
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'triggeredFlow',
        data: { flowName: 'neverFlow' },
        metadata: { revision: 1 }
      });

      await aeonstoreClient.storeDomainEvents({ domainEvents: [ domainEvent ]});
      await handleDomainEventClient.postDomainEvent({ domainEvent });

      await sleep({ ms: 1_500 });

      const lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executeFromFlow',
        data: { fromFlow: 'neverFlow' }
      });
    });

    test('with replay.', async (): Promise<void> => {
      const aggregateId = v4();
      const domainEvents = [
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
          name: 'triggeredFlow',
          data: { flowName: 'alwaysFlow' },
          metadata: { revision: 1 }
        }),
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
          name: 'triggeredFlow',
          data: { flowName: 'alwaysFlow' },
          metadata: { revision: 2 }
        }),
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
          name: 'triggeredFlow',
          data: { flowName: 'alwaysFlow' },
          metadata: { revision: 3 }
        })
      ];

      await aeonstoreClient.storeDomainEvents({ domainEvents });
      await handleDomainEventClient.postDomainEvent({ domainEvent: domainEvents[2] });

      await sleep({ ms: 1_500 });

      let lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executeFromFlow',
        data: { basedOnRevision: 1, fromFlow: 'alwaysFlow' }
      });

      await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });

      lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executeFromFlow',
        data: { basedOnRevision: 2, fromFlow: 'alwaysFlow' }
      });

      await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });

      lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executeFromFlow',
        data: { basedOnRevision: 3, fromFlow: 'alwaysFlow' }
      });

      await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });
    });

    test('publishes notifications.', async (): Promise<void> => {
      const aggregateId = v4();
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: { revision: 1 }
      });

      const messageStreamNotification = await subscribeMessagesClient.getMessages({
        channel: pubsubChannelForNotifications
      });

      await aeonstoreClient.storeDomainEvents({ domainEvents: [ domainEvent ]});
      await handleDomainEventClient.postDomainEvent({ domainEvent });

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
                  name: 'flowSampleFlowUpdated',
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
