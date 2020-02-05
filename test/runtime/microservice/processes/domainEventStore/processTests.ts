import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import axios from 'axios';
import { buildDomainEvent } from 'test/shared/buildDomainEvent';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { startProcess } from '../../../../shared/runtime/startProcess';
import { uuid } from 'uuidv4';
import { waitForSignals } from 'wait-for-signals';

suite('domain event store', function (): void {
  this.timeout(10_000);

  let port: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ port ] = await getAvailablePorts({ count: 1 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      port,
      env: {
        PORT: String(port)
      }
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }

    stopProcess = undefined;
  });

  suite('GET /health/v2', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const { status } = await axios({
        method: 'get',
        url: `http://localhost:${port}/health/v2`
      });

      assert.that(status).is.equalTo(200);
    });
  });

  suite('GET /query/v2/replay', (): void => {
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

      const { status: postStatus } = await axios({
        method: 'post',
        url: `http://localhost:${port}/write/v2/store-domain-events`,
        data: [ domainEvent ]
      });

      assert.that(postStatus).is.equalTo(200);

      const { status: replayStatus, data } = await axios({
        method: 'get',
        url: `http://localhost:${port}/query/v2/replay`,
        responseType: 'stream'
      });

      const collector = waitForSignals({ count: 2 });

      assert.that(replayStatus).is.equalTo(200);
      data.pipe(asJsonStream([
        async (heartbeat): Promise<void> => {
          assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });

          await collector.signal();
        },
        async (currentDomainEvent): Promise<void> => {
          assert.that(currentDomainEvent).is.equalTo(domainEvent);

          await collector.signal();
        }
      ]));

      await collector.promise;
    });
  });

  suite('GET /query/v2/replay/:aggregateId', (): void => {
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

      await axios({
        method: 'post',
        url: `http://localhost:${port}/write/v2/store-domain-events`,
        data: [ wrongDomainEvent, rightDomainEvent ]
      });

      const { status: replayStatus, data } = await axios({
        method: 'get',
        url: `http://localhost:${port}/query/v2/replay/${aggregateId}`,
        responseType: 'stream'
      });

      const collector = waitForSignals({ count: 2 });

      assert.that(replayStatus).is.equalTo(200);
      data.pipe(asJsonStream([
        async (heartbeat): Promise<void> => {
          assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });

          await collector.signal();
        },
        async (currentDomainEvent): Promise<void> => {
          assert.that(currentDomainEvent).is.equalTo(rightDomainEvent);

          await collector.signal();
        }
      ]));

      await collector.promise;
    });
  });

  suite('GET /query/v2/last-domain-event', (): void => {
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

      const { status: postStatus } = await axios({
        method: 'post',
        url: `http://localhost:${port}/write/v2/store-domain-events`,
        data: [ firstDomainEvent, secondDomainEvent ]
      });

      assert.that(postStatus).is.equalTo(200);

      const { status: getStatus, data } = await axios({
        method: 'get',
        url: `http://localhost:${port}/query/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
      });

      assert.that(getStatus).is.equalTo(200);
      assert.that(data).is.equalTo(secondDomainEvent);
    });
  });

  suite('GET /query/v2/snapshot', (): void => {
    test('returns the previously stored snapshot.', async (): Promise<void> => {
      const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };
      const snapshot = {
        aggregateIdentifier,
        revision: 1,
        state: {}
      };

      const { status: postStatus } = await axios({
        method: 'post',
        url: `http://localhost:${port}/write/v2/store-snapshot`,
        data: snapshot
      });

      assert.that(postStatus).is.equalTo(200);

      const { status: getStatus, data } = await axios({
        method: 'get',
        url: `http://localhost:${port}/query/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
      });

      assert.that(getStatus).is.equalTo(200);
      assert.that(data).is.equalTo(snapshot);
    });
  });
});
