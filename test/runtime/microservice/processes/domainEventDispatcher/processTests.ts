import { assert } from 'assertthat';
import { Client as AwaitDomainEventClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../../lib/common/elements/DomainEventData';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as PublishMessageClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { uuid } from 'uuidv4';

suite('domainEventDispatcher', function (): void {
  this.timeout(10 * 1000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const queueLockExpirationTime = 600;

  let awaitDomainEventClient: AwaitDomainEventClient<DomainEvent<DomainEventData>>,
      healthPortDomainEventDispatcher: number,
      healthPortPublisher: number,
      portDomainEventDispatcher: number,
      portPublisher: number,
      publishMessageClient: PublishMessageClient,
      stopProcessDomainEventDispatcher: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ portDomainEventDispatcher, healthPortDomainEventDispatcher, portPublisher, healthPortPublisher ] = await getAvailablePorts({ count: 4 });

    stopProcessPublisher = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      port: healthPortPublisher,
      env: {
        PORT: String(portPublisher),
        HEALTH_PORT: String(healthPortPublisher)
      }
    });

    publishMessageClient = new PublishMessageClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portPublisher,
      path: '/publish/v2'
    });

    stopProcessDomainEventDispatcher = await startProcess({
      runtime: 'microservice',
      name: 'domainEventDispatcher',
      enableDebugMode: false,
      port: healthPortDomainEventDispatcher,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":${queueLockExpirationTime}}`,
        PORT: String(portDomainEventDispatcher),
        HEALTH_PORT: String(healthPortDomainEventDispatcher),
        SUBSCRIBE_MESSAGES_PROTOCOL: 'http',
        SUBSCRIBE_MESSAGES_HOST_NAME: 'localhost',
        SUBSCRIBE_MESSAGES_PORT: String(portPublisher),
        SUBSCRIBE_MESSAGES_CHANNEL: 'newDomainEventInternal'
      }
    });

    awaitDomainEventClient = new AwaitDomainEventClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portDomainEventDispatcher,
      path: '/await-domain-event/v2',
      createItemInstance: ({ item }: { item: DomainEvent<DomainEventData> }): DomainEvent<DomainEventData> => new DomainEvent<DomainEventData>(item)
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcessDomainEventDispatcher) {
      await stopProcessDomainEventDispatcher();
    }
    if (stopProcessPublisher) {
      await stopProcessPublisher();
    }

    stopProcessPublisher = undefined;
    stopProcessDomainEventDispatcher = undefined;
  });

  suite('getHealth', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new HealthClient({
        protocol: 'http',
        hostName: 'localhost',
        port: healthPortDomainEventDispatcher,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('awaitDomainEvent', (): void => {
    test('delivers a domain event that is sent to the publisher.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          revision: 1
        }
      });

      await publishMessageClient.postMessage({
        channel: 'newDomainEventInternal',
        message: domainEvent
      });

      const lock = await awaitDomainEventClient.awaitItem();

      assert.that(lock.item).is.equalTo(domainEvent);
    });
  });
});
