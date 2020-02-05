import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import axios from 'axios';
import { buildDomainEvent } from '../../../../shared/buildDomainEvent';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { DomainEventWithState } from '../../../../../lib/common/elements/DomainEventWithState';
import { errors } from '../../../../../lib/common/errors';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import path from 'path';
import { startProcess } from '../../../../shared/runtime/startProcess';
import { uuid } from 'uuidv4';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('domain event', function (): void {
  this.timeout(10 * 1000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let port: number,
      portPublisher: number,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined;

  setup(async function (): Promise<void> {
    this.timeout(60 * 1000);

    [ port, portPublisher ] = await getAvailablePorts({ count: 2 });

    stopProcessPublisher = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      port: portPublisher,
      env: {
        PORT: String(portPublisher)
      }
    });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEvent',
      port,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PORT: String(port),
        IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`,
        SUBSCRIBE_MESSAGES_HOST_NAME: 'localhost',
        SUBSCRIBE_MESSAGES_PORT: String(portPublisher)
      }
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }
    if (stopProcessPublisher) {
      await stopProcessPublisher();
    }

    stopProcess = undefined;
    stopProcessPublisher = undefined;
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

  suite('GET /domain-events/v2', (): void => {
    test('does not stream invalid domain events.', async (): Promise<void> => {
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

      setTimeout(async (): Promise<void> => {
        const { status } = await axios({
          method: 'post',
          url: `http://localhost:${portPublisher}/publish/v2`,
          data: domainEventWithoutState
        });

        assert.that(status).is.equalTo(200);
      }, 50);

      await new Promise(async (resolve, reject): Promise<void> => {
        try {
          const { data } = await axios({
            method: 'get',
            url: `http://localhost:${port}/domain-events/v2`,
            responseType: 'stream'
          });

          data.pipe(asJsonStream<DomainEvent<any>>([
            (receivedEvent): void => {
              assert.that(receivedEvent).is.equalTo({ name: 'heartbeat' });

              setTimeout((): void => {
                resolve();
              }, 100);
            },
            (): void => {
              throw new errors.InvalidOperation();
            }
          ]));
        } catch (ex) {
          reject(ex);
        }
      });
    });

    test('streams domain events from the publisher.', async (): Promise<void> => {
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
          url: `http://localhost:${portPublisher}/publish/v2`,
          data: domainEvent
        });

        assert.that(status).is.equalTo(200);
      }, 50);

      await new Promise(async (resolve, reject): Promise<void> => {
        try {
          const { data } = await axios({
            method: 'get',
            url: `http://localhost:${port}/domain-events/v2`,
            responseType: 'stream'
          });

          data.pipe(asJsonStream<DomainEvent<any>>([
            (receivedEvent): void => {
              assert.that(receivedEvent).is.equalTo({ name: 'heartbeat' });
            },
            (receivedEvent): void => {
              assert.that(receivedEvent.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ]));
        } catch (ex) {
          reject(ex);
        }
      });
    });
  });
});
