import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../shared/buildDomainEvent';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { DomainEventWithState } from '../../../../../lib/common/elements/DomainEventWithState';
import { errors } from '../../../../../lib/common/errors';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as ObserveDomainEventsClient } from '../../../../../lib/apis/observeDomainEvents/http/v2/Client';
import path from 'path';
import { Client as PublishMessageClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { uuid } from 'uuidv4';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('domain event', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let healthPort: number,
      observeDomainEventsClient: ObserveDomainEventsClient,
      port: number,
      publisherHealthPort: number,
      publisherPort: number,
      publishMessageClient: PublishMessageClient,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined;

  setup(async function (): Promise<void> {
    this.timeout(60 * 1000);

    [ port, healthPort, publisherPort, publisherHealthPort ] = await getAvailablePorts({ count: 4 });

    stopProcessPublisher = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      port: publisherHealthPort,
      env: {
        PORT: String(publisherPort),
        HEALTH_PORT: String(publisherHealthPort)
      }
    });

    publishMessageClient = new PublishMessageClient({
      protocol: 'http',
      hostName: 'localhost',
      port: publisherPort,
      path: '/publish/v2'
    });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEvent',
      enableDebugMode: false,
      port: healthPort,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PORT: String(port),
        HEALTH_PORT: String(healthPort),
        IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`,
        SUBSCRIBE_MESSAGES_HOST_NAME: 'localhost',
        SUBSCRIBE_MESSAGES_PORT: String(publisherPort),
        SNAPSHOT_STRATEGY: `{"name":"never"}`
      }
    });

    observeDomainEventsClient = new ObserveDomainEventsClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/domain-events/v2'
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

  suite('getDomainEvents', (): void => {
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
        await publishMessageClient.postMessage({ message: domainEventWithoutState });
      }, 50);

      const domainEventStream = await observeDomainEventsClient.getDomainEvents({});

      await new Promise(async (resolve, reject): Promise<void> => {
        try {
          domainEventStream.pipe(asJsonStream<DomainEvent<any>>(
            [
              (): void => {
                throw new errors.InvalidOperation();
              }
            ],
            true
          ));

          setTimeout((): void => {
            resolve();
          }, 500);
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
        await publishMessageClient.postMessage({ message: domainEvent });
      }, 50);

      await new Promise(async (resolve, reject): Promise<void> => {
        try {
          const domainEventStream = await observeDomainEventsClient.getDomainEvents({});

          domainEventStream.pipe(asJsonStream<DomainEvent<any>>(
            [
              (receivedEvent): void => {
                assert.that(receivedEvent.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ],
            true
          ));
        } catch (ex) {
          reject(ex);
        }
      });
    });
  });
});
