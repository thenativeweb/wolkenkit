import { Client as AeonstoreClient } from '../../../../../lib/apis/writeDomainEventStore/http/v2/Client';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { CommandData } from '../../../../../lib/common/elements/CommandData';
import { Client as CommandDispatcherClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { CommandWithMetadata } from '../../../../../lib/common/elements/CommandWithMetadata';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as PublisherClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { sleep } from '../../../../../lib/common/utils/sleep';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { uuid } from 'uuidv4';

suite.only('flow server', function (): void {
  this.timeout(10_000);

  let aeonstoreClient: AeonstoreClient,
      applicationDirectory: string,
      commandDispatcherClient: CommandDispatcherClient<CommandWithMetadata<CommandData>>,
      healthPort: number,
      healthPortAeonstore: number,
      healthPortCommandDispatcher: number,
      healthPortDomainEventDispatcher: number,
      healthPortPublisher: number,
      portAeonstore: number,
      portCommandDispatcher: number,
      portDomainEventDispatcher: number,
      portPublisher: number,
      publisherClient: PublisherClient,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessAeonstore: (() => Promise<void>) | undefined,
      stopProcessCommandDispatcher: (() => Promise<void>) | undefined,
      stopProcessDomainEventDispatcher: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

    [
      healthPort,
      portPublisher,
      healthPortPublisher,
      portCommandDispatcher,
      healthPortCommandDispatcher,
      portDomainEventDispatcher,
      healthPortDomainEventDispatcher,
      portAeonstore,
      healthPortAeonstore
    ] = await getAvailablePorts({ count: 9 });

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

    publisherClient = new PublisherClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portPublisher,
      path: '/publish/v2'
    });

    stopProcessCommandDispatcher = await startProcess({
      runtime: 'microservice',
      name: 'commandDispatcher',
      enableDebugMode: false,
      port: healthPortCommandDispatcher,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":5000}`,
        PORT: String(portCommandDispatcher),
        HEALTH_PORT: String(healthPortCommandDispatcher)
      }
    });

    commandDispatcherClient = new CommandDispatcherClient<CommandWithMetadata<CommandData>>({
      protocol: 'http',
      hostName: 'localhost',
      port: portCommandDispatcher,
      path: '/await-command/v2',
      createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
    });

    stopProcessDomainEventDispatcher = await startProcess({
      runtime: 'microservice',
      name: 'domainEventDispatcher',
      enableDebugMode: false,
      port: healthPortDomainEventDispatcher,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":5000}`,
        PORT: String(portDomainEventDispatcher),
        HEALTH_PORT: String(healthPortDomainEventDispatcher),
        SUBSCRIBE_MESSAGES_PROTOCOL: 'http',
        SUBSCRIBE_MESSAGES_HOST_NAME: 'localhost',
        SUBSCRIBE_MESSAGES_PORT: String(portPublisher),
        SUBSCRIBE_MESSAGES_CHANNEL: 'newDomainEventInternal'
      }
    });

    stopProcessAeonstore = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      enableDebugMode: false,
      port: healthPortAeonstore,
      env: {
        PORT: String(portAeonstore),
        HEALTH_PORT: String(healthPortAeonstore)
      }
    });

    aeonstoreClient = new AeonstoreClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portAeonstore,
      path: '/query/v2'
    });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'flow',
      enableDebugMode: false,
      port: healthPort,
      env: {
        DOMAIN_EVENT_DISPATCHER_PROTOCOL: 'http',
        DOMAIN_EVENT_DISPATCHER_HOST_NAME: 'localhost',
        DOMAIN_EVENT_DISPATCHER_PORT: String(portDomainEventDispatcher),
        DOMAIN_EVENT_DISPATCHER_RENEW_INTERVAL: String(5000),
        DOMAIN_EVENT_DISPATCHER_ACKNOWLEDGE_RETRIES: String(5),
        COMMAND_DISPATCHER_PROTOCOL: 'http',
        COMMAND_DISPATCHER_HOST_NAME: 'localhost',
        COMMAND_DISPATCHER_PORT: String(portCommandDispatcher),
        AEONSTORE_PROTOCOL: 'http',
        AEONSTORE_HOST_NAME: 'localhost',
        AEONSTORE_PORT: String(portAeonstore),
        LOCK_STORE_TYPE: 'InMemory',
        LOCK_STORE_OPTIONS: '{}',
        CONSUMER_PROGRESS_STORE_TYPE: 'InMemory',
        CONSUMER_PROGRESS_STORE_OPTIONS: '{}',
        HEALTH_CORS_ORIGIN: '*',
        HEALTH_PORT: String(healthPort),
        CONCURRENT_FLOWS: String(1)
      }
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcessCommandDispatcher) {
      await stopProcessCommandDispatcher();
    }
    if (stopProcessDomainEventDispatcher) {
      await stopProcessDomainEventDispatcher();
    }
    if (stopProcessAeonstore) {
      await stopProcessAeonstore();
    }
    if (stopProcessPublisher) {
      await stopProcessPublisher();
    }
    if (stopProcess) {
      await stopProcess();
    }

    stopProcessDomainEventDispatcher = undefined;
    stopProcessCommandDispatcher = undefined;
    stopProcessAeonstore = undefined;
    stopProcessPublisher = undefined;
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

  suite('executes flow', (): void => {
    test('for a domain received via the domain event dispatcher.', async (): Promise<void> => {
      const aggregateId = uuid();
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'aggregateIdentifier', id: aggregateId },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          revision: 1
        }
      });

      await aeonstoreClient.storeDomainEvents({ domainEvents: [ domainEvent ]});
      await publisherClient.postMessage({ channel: 'newDomainEventInternal', message: domainEvent });

      await sleep({ ms: 1500 });

      const lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'aggregateIdentifier', id: aggregateId },
        name: 'executeFromFlow',
        data: {}
      });
    });
  });
});
