import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../../lib/common/elements/DomainEventData';
import { Client as DomainEventDispatcherClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { Configuration as DomainEventDispatcherConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/Configuration';
import { configurationDefinition as domainEventDispatcherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/configurationDefinition';
import { Configuration as DomainEventStoreConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/Configuration';
import { configurationDefinition as domainEventStoreConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getSocketPaths } from '../../../../shared/getSocketPaths';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as ReplayClient } from '../../../../../lib/apis/performReplay/http/v2/Client';
import { Configuration as ReplayConfiguration } from '../../../../../lib/runtimes/microservice/processes/replay/Configuration';
import { configurationDefinition as replayConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/replay/configurationDefinition';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';
import { Client as WriteDomainEventStoreClient } from '../../../../../lib/apis/writeDomainEventStore/http/v2/Client';

suite('replay process', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

  const queueLockExpirationTime = 600,
        queuePollInterval = 600;

  let domainEventDispatcherClient: DomainEventDispatcherClient<DomainEvent<DomainEventData>>,
      domainEventDispatcherHealthSocket: string,
      domainEventDispatcherSocket: string,
      domainEventStoreHealthSocket: string,
      domainEventStoreSocket: string,
      replayClient: ReplayClient,
      replayHealthSocket: string,
      replaySocket: string,
      stopDomainEventDispatcherProcess: (() => Promise<void>) | undefined,
      stopDomainEventStoreProcess: (() => Promise<void>) | undefined,
      stopReplayProcess: (() => Promise<void>) | undefined,
      writeDomainEventStoreClient: WriteDomainEventStoreClient;

  setup(async (): Promise<void> => {
    [
      domainEventDispatcherSocket,
      domainEventDispatcherHealthSocket,
      domainEventStoreSocket,
      domainEventStoreHealthSocket,
      replayHealthSocket,
      replaySocket
    ] = await getSocketPaths({ count: 6 });

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

    domainEventDispatcherClient = new DomainEventDispatcherClient<DomainEvent<DomainEventData>>({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: domainEventDispatcherSocket,
      path: '/await-domain-event/v2',
      createItemInstance: ({ item }): DomainEvent<DomainEventData> => new DomainEvent<DomainEventData>(item)
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

    writeDomainEventStoreClient = new WriteDomainEventStoreClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: domainEventStoreSocket,
      path: '/write/v2'
    });

    const replayConfiguration: ReplayConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: replayConfigurationDefinition }),
      applicationDirectory,
      domainEventDispatcherHostName: 'localhost',
      domainEventDispatcherPortOrSocket: domainEventDispatcherSocket,
      aeonstoreHostName: 'localhost',
      aeonstorePortOrSocket: domainEventStoreSocket,
      portOrSocket: replaySocket,
      healthPortOrSocket: replayHealthSocket
    };

    stopReplayProcess = await startProcess({
      runtime: 'microservice',
      name: 'replay',
      enableDebugMode: false,
      portOrSocket: replayHealthSocket,
      env: toEnvironmentVariables({
        configuration: replayConfiguration,
        configurationDefinition: replayConfigurationDefinition
      })
    });

    replayClient = new ReplayClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: replaySocket,
      path: '/perform-replay/v2'
    });
  });

  teardown(async (): Promise<void> => {
    if (stopDomainEventDispatcherProcess) {
      await stopDomainEventDispatcherProcess();
    }
    if (stopDomainEventStoreProcess) {
      await stopDomainEventStoreProcess();
    }
    if (stopReplayProcess) {
      await stopReplayProcess();
    }

    stopDomainEventDispatcherProcess = undefined;
    stopDomainEventStoreProcess = undefined;
    stopReplayProcess = undefined;
  });

  suite('getHealth', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new HealthClient({
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: replayHealthSocket,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('performing replay', (): void => {
    test('dispatches domain events for the requested aggregate.', async (): Promise<void> => {
      const aggregateId = v4();

      await writeDomainEventStoreClient.storeDomainEvents({
        domainEvents: [
          buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: { revision: 1 }
          }),
          buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: { revision: 2 }
          }),
          buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: { revision: 3 }
          }),
          buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: { revision: 4 }
          })
        ]
      });

      await replayClient.performReplay({
        aggregates: [{
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId }
          },
          from: 2,
          to: 3
        }]
      });

      let { item, metadata: { discriminator, token }} = await domainEventDispatcherClient.awaitItem();

      assert.that(item.metadata.revision).is.equalTo(2);
      assert.that(discriminator).is.equalTo('sampleFlow');

      await domainEventDispatcherClient.acknowledge({ discriminator, token });

      ({ item, metadata: { discriminator, token }} = await domainEventDispatcherClient.awaitItem());

      assert.that(item.metadata.revision).is.equalTo(3);
      assert.that(discriminator).is.equalTo('sampleFlow');

      await domainEventDispatcherClient.acknowledge({ discriminator, token });
    });
  });
});
