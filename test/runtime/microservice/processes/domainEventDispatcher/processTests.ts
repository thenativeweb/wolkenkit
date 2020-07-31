import { assert } from 'assertthat';
import { Client as AwaitDomainEventClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { DomainEvent } from '../../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../../lib/common/elements/DomainEventData';
import { Configuration as DomainEventDispatcherConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/Configuration';
import { configurationDefinition as domainEventDispatcherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/configurationDefinition';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleDomainEventClient } from '../../../../../lib/apis/handleDomainEvent/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { uuid } from 'uuidv4';

suite('domainEventDispatcher', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const queueLockExpirationTime = 600;

  let awaitDomainEventClient: AwaitDomainEventClient<DomainEvent<DomainEventData>>,
      handleDomainEventClient: HandleDomainEventClient,
      healthPortDomainEventDispatcher: number,
      portDomainEventDispatcher: number,
      stopProcessDomainEventDispatcher: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ portDomainEventDispatcher, healthPortDomainEventDispatcher ] = await getAvailablePorts({ count: 2 });

    const domainEventDispatcherConfiguration: DomainEventDispatcherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainEventDispatcherConfigurationDefinition }),
      applicationDirectory,
      priorityQueueStoreOptions: { type: 'InMemory', expirationTime: queueLockExpirationTime },
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

    awaitDomainEventClient = new AwaitDomainEventClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portDomainEventDispatcher,
      path: '/await-domain-event/v2',
      createItemInstance: ({ item }): DomainEvent<DomainEventData> => new DomainEvent<DomainEventData>(item)
    });

    handleDomainEventClient = new HandleDomainEventClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portDomainEventDispatcher,
      path: '/handle-domain-event/v2'
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
    test('delivers a domain event that is sent using the handle route.', async (): Promise<void> => {
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

      await handleDomainEventClient.postDomainEvent({ domainEvent });

      const lock = await awaitDomainEventClient.awaitItem();

      assert.that(lock.item).is.equalTo(domainEvent);
    });
  });
});
