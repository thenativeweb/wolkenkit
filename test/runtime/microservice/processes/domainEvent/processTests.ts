import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../shared/buildDomainEvent';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { DomainEventWithState } from '../../../../../lib/common/elements/DomainEventWithState';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import path from 'path';
import { startProcess } from '../../../../shared/runtime/startProcess';
import { uuid } from 'uuidv4';
import axios, { AxiosError } from 'axios';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('domain event', function (): void {
  this.timeout(10 * 1000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let portPublisher: number,
      portReceiver: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ portPublisher, portReceiver ] = await getAvailablePorts({ count: 2 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEvent',
      port: portPublisher,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PORT_PUBLISHER: String(portPublisher),
        PORT_RECEIVER: String(portReceiver),
        IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`
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
    suite('external', (): void => {
      test('is using the health API.', async (): Promise<void> => {
        const { status } = await axios({
          method: 'get',
          url: `http://localhost:${portPublisher}/health/v2`
        });

        assert.that(status).is.equalTo(200);
      });
    });

    suite('internal', (): void => {
      test('is using the health API.', async (): Promise<void> => {
        const { status } = await axios({
          method: 'get',
          url: `http://localhost:${portReceiver}/health/v2`
        });

        assert.that(status).is.equalTo(200);
      });
    });
  });

  suite('POST /domain-event/v2 (internal)', (): void => {
    test('rejects invalid domain events.', async (): Promise<void> => {
      const domainEventWithoutState = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'nonExistent',
        data: {},
        metadata: {
          revision: { aggregate: 1, global: null },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      await assert.that(async (): Promise<void> => {
        await axios({
          method: 'post',
          url: `http://localhost:${portReceiver}/domain-event/v2`,
          data: domainEventWithoutState
        });
      }).is.throwingAsync((ex): boolean => (ex as AxiosError).response!.status === 400);
    });

    test('forwards domain events to the external domain event API.', async (): Promise<void> => {
      const domainEvent = new DomainEventWithState({
        ...buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1, global: null },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        }),
        state: {
          previous: {},
          next: {}
        }
      });

      setTimeout(async (): Promise<void> => {
        const { status } = await axios({
          method: 'post',
          url: `http://localhost:${portReceiver}/domain-event/v2`,
          data: domainEvent
        });

        assert.that(status).is.equalTo(200);
      }, 50);

      await new Promise(async (resolve, reject): Promise<void> => {
        try {
          const { data } = await axios({
            method: 'get',
            url: `http://localhost:${portPublisher}/domain-events/v2`,
            responseType: 'stream'
          });

          data.pipe(asJsonStream<DomainEvent<any>>(
            (receivedEvent): void => {
              assert.that(receivedEvent).is.equalTo({ name: 'heartbeat' });
            },
            (receivedEvent): void => {
              assert.that(receivedEvent.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ));
        } catch (ex) {
          reject(ex);
        }
      });
    });
  });
});
