import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { Configuration as DomainEventConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEvent/Configuration';
import { configurationDefinition as domainEventConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEvent/configurationDefinition';
import { Configuration as DomainEventStoreConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/Configuration';
import { configurationDefinition as domainEventStoreConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition';
import { DomainEventWithState } from '../../../../../lib/common/elements/DomainEventWithState';
import { errors } from '../../../../../lib/common/errors';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as ObserveDomainEventsClient } from '../../../../../lib/apis/observeDomainEvents/http/v2/Client';
import path from 'path';
import { Configuration as PublisherConfiguration } from '../../../../../lib/runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition';
import { Client as PublishMessageClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { SnapshotStrategyConfiguration } from '../../../../../lib/common/domain/SnapshotStrategyConfiguration';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('domain event', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' }),
        pubSubChannelForNewDomainEvent = 'newDomainEvent',
        pubSubChannelNotification = 'notification';

  let domainEventStoreHealthPort: number,
      domainEventStorePort: number,
      healthPort: number,
      observeDomainEventsClient: ObserveDomainEventsClient,
      port: number,
      publisherHealthPort: number,
      publisherPort: number,
      publishMessageClient: PublishMessageClient,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessDomainEventStore: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined;

  setup(async function (): Promise<void> {
    this.timeout(60_000);

    [
      port,
      healthPort,
      publisherPort,
      publisherHealthPort,
      domainEventStorePort,
      domainEventStoreHealthPort
    ] = await getAvailablePorts({ count: 6 });

    const publisherConfiguration: PublisherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: publisherConfigurationDefinition }),
      port: publisherPort,
      healthPort: publisherHealthPort
    };

    stopProcessPublisher = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      port: publisherHealthPort,
      env: toEnvironmentVariables({
        configuration: publisherConfiguration,
        configurationDefinition: publisherConfigurationDefinition
      })
    });

    publishMessageClient = new PublishMessageClient({
      protocol: 'http',
      hostName: 'localhost',
      port: publisherPort,
      path: '/publish/v2'
    });

    const domainEventStoreConfiguration: DomainEventStoreConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainEventStoreConfigurationDefinition }),
      port: domainEventStorePort,
      healthPort: domainEventStoreHealthPort
    };

    stopProcessDomainEventStore = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      enableDebugMode: false,
      port: domainEventStoreHealthPort,
      env: toEnvironmentVariables({
        configuration: domainEventStoreConfiguration,
        configurationDefinition: domainEventStoreConfigurationDefinition
      })
    });

    const domainEventConfiguration: DomainEventConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainEventConfigurationDefinition }),
      aeonstoreHostName: 'localhost',
      aeonstorePort: domainEventStorePort,
      applicationDirectory,
      port,
      healthPort,
      identityProviders: [{ issuer: 'https://token.invalid', certificate: certificateDirectory }],
      pubSubOptions: {
        channelForNewDomainEvent: pubSubChannelForNewDomainEvent,
        channelForNotification: pubSubChannelNotification,

        // TODO: replace this with http based publisher
        publisher: { type: 'InMemory' },
        subscriber: { type: 'InMemory' }
      },
      snapshotStrategy: { name: 'never' } as SnapshotStrategyConfiguration
    };

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEvent',
      enableDebugMode: false,
      port: healthPort,
      env: toEnvironmentVariables({
        configuration: domainEventConfiguration,
        configurationDefinition: domainEventConfigurationDefinition
      })
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
    if (stopProcessDomainEventStore) {
      await stopProcessDomainEventStore();
    }

    stopProcess = undefined;
    stopProcessPublisher = undefined;
    stopProcessDomainEventStore = undefined;
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
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'nonExistent',
        data: {},
        metadata: {
          revision: 1,
          initiator: { user: { id: v4(), claims: { sub: v4() }}}
        }
      });

      setTimeout(async (): Promise<void> => {
        await publishMessageClient.postMessage({
          channel: pubSubChannelForNewDomainEvent,
          message: domainEventWithoutState
        });
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
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: 1,
            initiator: { user: { id: v4(), claims: { sub: v4() }}}
          }
        }),
        state: {
          previous: {},
          next: {}
        }
      });

      setTimeout(async (): Promise<void> => {
        await publishMessageClient.postMessage({
          channel: pubSubChannelForNewDomainEvent,
          message: domainEvent
        });
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
