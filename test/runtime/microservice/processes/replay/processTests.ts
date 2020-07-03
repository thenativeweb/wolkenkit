import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../../lib/common/elements/DomainEventData';
import { Client as DomainEventDispatcherClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as ReplayClient } from '../../../../../lib/apis/performReplay/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { uuid } from 'uuidv4';
import { Client as WriteDomainEventStoreClient } from '../../../../../lib/apis/writeDomainEventStore/http/v2/Client';

suite('replay', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

  const queueLockExpirationTime = 600,
        queuePollInterval = 600;

  let domainEventDispatcherClient: DomainEventDispatcherClient<DomainEvent<DomainEventData>>,
      domainEventDispatcherHealthPort: number,
      domainEventDispatcherPort: number,
      domainEventStoreHealthPort: number,
      domainEventStorePort: number,
      replayClient: ReplayClient,
      replayHealthPort: number,
      replayPort: number,
      stopDomainEventDispatcherProcess: (() => Promise<void>) | undefined,
      stopDomainEventStoreProcess: (() => Promise<void>) | undefined,
      stopReplayProcess: (() => Promise<void>) | undefined,
      writeDomainEventStoreClient: WriteDomainEventStoreClient;

  setup(async (): Promise<void> => {
    [
      domainEventDispatcherPort,
      domainEventDispatcherHealthPort,
      domainEventStorePort,
      domainEventStoreHealthPort,
      replayHealthPort,
      replayPort
    ] = await getAvailablePorts({ count: 6 });

    stopDomainEventDispatcherProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEventDispatcher',
      enableDebugMode: false,
      port: domainEventDispatcherHealthPort,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":${queueLockExpirationTime}}`,
        PORT: String(domainEventDispatcherPort),
        HEALTH_PORT: String(domainEventDispatcherHealthPort),
        QUEUE_POLL_INTERVAL: String(queuePollInterval)
      }
    });

    domainEventDispatcherClient = new DomainEventDispatcherClient<DomainEvent<DomainEventData>>({
      protocol: 'http',
      hostName: 'localhost',
      port: domainEventDispatcherPort,
      path: '/await-domain-event/v2',
      createItemInstance: ({ item }): DomainEvent<DomainEventData> => new DomainEvent<DomainEventData>(item)
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

    writeDomainEventStoreClient = new WriteDomainEventStoreClient({
      protocol: 'http',
      hostName: 'localhost',
      port: domainEventStorePort,
      path: '/write/v2'
    });

    stopReplayProcess = await startProcess({
      runtime: 'microservice',
      name: 'replay',
      enableDebugMode: false,
      port: replayHealthPort,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        DOMAIN_EVENT_DISPATCHER_PROTOCOL: 'http',
        DOMAIN_EVENT_DISPATCHER_HOST_NAME: 'localhost',
        DOMAIN_EVENT_DISPATCHER_PORT: String(domainEventDispatcherPort),
        AEONSTORE_PROTOCOL: 'http',
        AEONSTORE_HOST_NAME: 'localhost',
        AEONSTORE_PORT: String(domainEventStorePort),
        AEONSTORE_RETRIES: String(0),
        HEALTH_PORT: String(replayHealthPort),
        PORT: String(replayPort)
      }
    });

    replayClient = new ReplayClient({
      protocol: 'http',
      hostName: 'localhost',
      port: replayPort,
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
        port: replayHealthPort,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('performing replay', (): void => {
    test('dispatches domain events for the requested aggregate.', async (): Promise<void> => {
      const aggregateId = uuid();

      await writeDomainEventStoreClient.storeDomainEvents({
        domainEvents: [
          buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: { revision: 1 }
          }),
          buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: { revision: 2 }
          }),
          buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: { revision: 3 }
          }),
          buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: { revision: 4 }
          })
        ]
      });

      await replayClient.performReplay({
        aggregates: [{
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
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
