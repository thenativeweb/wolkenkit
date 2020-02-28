import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../shared/buildDomainEvent';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as QueryDomainEventStoreClient } from '../../../../../lib/apis/queryDomainEventStore/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { uuid } from 'uuidv4';
import { waitForSignals } from 'wait-for-signals';
import { Client as WriteDomainEventStoreClient } from '../../../../../lib/apis/writeDomainEventStore/http/v2/Client';

suite('domain event store', function (): void {
  this.timeout(10_000);

  let healthPort: number,
      port: number,
      queryDomainEventStoreClient: QueryDomainEventStoreClient,
      stopProcess: (() => Promise<void>) | undefined,
      writeDomainEventStoreClient: WriteDomainEventStoreClient;

  setup(async (): Promise<void> => {
    [ port, healthPort ] = await getAvailablePorts({ count: 2 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      enableDebugMode: false,
      port: healthPort,
      env: {
        PORT: String(port),
        HEALTH_PORT: String(healthPort)
      }
    });

    queryDomainEventStoreClient = new QueryDomainEventStoreClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/query/v2'
    });

    writeDomainEventStoreClient = new WriteDomainEventStoreClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/write/v2'
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }

    stopProcess = undefined;
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

  suite('getReplay', (): void => {
    test('streams all previously stored domain events.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: {},
        metadata: {
          revision: { aggregate: 1, global: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await writeDomainEventStoreClient.storeDomainEvents({ domainEvents: [ domainEvent ]});

      const eventReplay = await queryDomainEventStoreClient.getReplay({});

      const collector = waitForSignals({ count: 1 });

      eventReplay.pipe(asJsonStream(
        [
          async (currentDomainEvent): Promise<void> => {
            assert.that(currentDomainEvent).is.equalTo(domainEvent);

            await collector.signal();
          }
        ],
        true
      ));

      await collector.promise;
    });
  });

  suite('getReplayForAggregate', (): void => {
    test('streams only domain events for the requested aggregate.', async (): Promise<void> => {
      const wrongDomainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: {},
        metadata: {
          revision: { aggregate: 1, global: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const aggregateId = uuid();

      const rightDomainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'execute',
        data: {},
        metadata: {
          revision: { aggregate: 1, global: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await writeDomainEventStoreClient.storeDomainEvents({ domainEvents: [ wrongDomainEvent, rightDomainEvent ]});

      const eventReplay = await queryDomainEventStoreClient.getReplayForAggregate({ aggregateId });

      const collector = waitForSignals({ count: 1 });

      eventReplay.pipe(asJsonStream(
        [
          async (currentDomainEvent): Promise<void> => {
            assert.that(currentDomainEvent).is.equalTo(rightDomainEvent);

            await collector.signal();
          }
        ],
        true
      ));

      await collector.promise;
    });
  });

  suite('getLastDomainEvent', (): void => {
    test('returns the last stored domain event.', async (): Promise<void> => {
      const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };
      const firstDomainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        name: 'execute',
        data: {},
        metadata: {
          revision: { aggregate: 1, global: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const secondDomainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        name: 'execute',
        data: {},
        metadata: {
          revision: { aggregate: 2, global: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await writeDomainEventStoreClient.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent ]});

      const lastDomainEvent = await queryDomainEventStoreClient.getLastDomainEvent({ aggregateIdentifier });

      assert.that(lastDomainEvent).is.equalTo(secondDomainEvent);
    });
  });

  suite('getSnapshot', (): void => {
    test('returns the previously stored snapshot.', async (): Promise<void> => {
      const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };
      const snapshot = {
        aggregateIdentifier,
        revision: 1,
        state: {}
      };

      await writeDomainEventStoreClient.storeSnapshot({ snapshot });

      const lastSnapshot = await queryDomainEventStoreClient.getSnapshot({ aggregateIdentifier });

      assert.that(lastSnapshot).is.equalTo(snapshot);
    });
  });
});
