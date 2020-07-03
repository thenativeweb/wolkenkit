import { Client as AeonstoreClient } from '../../../../../lib/apis/writeDomainEventStore/http/v2/Client';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { CommandData } from '../../../../../lib/common/elements/CommandData';
import { Client as CommandDispatcherClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { CommandWithMetadata } from '../../../../../lib/common/elements/CommandWithMetadata';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleDomainEventClient } from '../../../../../lib/apis/handleDomainEvent/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { sleep } from '../../../../../lib/common/utils/sleep';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { uuid } from 'uuidv4';

suite('flow server', function (): void {
  this.timeout(60_000);

  let aeonstoreClient: AeonstoreClient,
      applicationDirectory: string,
      commandDispatcherClient: CommandDispatcherClient<CommandWithMetadata<CommandData>>,
      handleDomainEventClient: HandleDomainEventClient,
      healthPort: number,
      healthPortAeonstore: number,
      healthPortCommandDispatcher: number,
      healthPortDomainEventDispatcher: number,
      healthPortReplay: number,
      portAeonstore: number,
      portCommandDispatcher: number,
      portDomainEventDispatcher: number,
      portReplay: number,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessAeonstore: (() => Promise<void>) | undefined,
      stopProcessCommandDispatcher: (() => Promise<void>) | undefined,
      stopProcessDomainEventDispatcher: (() => Promise<void>) | undefined,
      stopReplayServer: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    applicationDirectory = getTestApplicationDirectory({ name: 'withComplexFlow', language: 'javascript' });

    [
      healthPort,
      portCommandDispatcher,
      healthPortCommandDispatcher,
      portDomainEventDispatcher,
      healthPortDomainEventDispatcher,
      portReplay,
      healthPortReplay,
      portAeonstore,
      healthPortAeonstore
    ] = await getAvailablePorts({ count: 9 });

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
        HEALTH_PORT: String(healthPortDomainEventDispatcher)
      }
    });

    handleDomainEventClient = new HandleDomainEventClient({
      protocol: 'http',
      hostName: 'localhost',
      port: portDomainEventDispatcher,
      path: '/handle-domain-event/v2'
    });

    stopReplayServer = await startProcess({
      runtime: 'microservice',
      name: 'replay',
      enableDebugMode: false,
      port: healthPortReplay,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        DOMAIN_EVENT_DISPATCHER_PROTOCOL: 'http',
        DOMAIN_EVENT_DISPATCHER_HOST_NAME: 'localhost',
        DOMAIN_EVENT_DISPATCHER_PORT: String(portDomainEventDispatcher),
        AEONSTORE_PROTOCOL: 'http',
        AEONSTORE_HOST_NAME: 'localhost',
        AEONSTORE_PORT: String(portAeonstore),
        AEONSTORE_RETRIES: String(0),
        PORT: String(portReplay),
        HEALTH_PORT: String(healthPortReplay)
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
      path: '/write/v2'
    });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'flow',
      enableDebugMode: false,
      port: healthPort,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        DOMAIN_EVENT_DISPATCHER_PROTOCOL: 'http',
        DOMAIN_EVENT_DISPATCHER_HOST_NAME: 'localhost',
        DOMAIN_EVENT_DISPATCHER_PORT: String(portDomainEventDispatcher),
        DOMAIN_EVENT_DISPATCHER_RENEW_INTERVAL: String(5000),
        DOMAIN_EVENT_DISPATCHER_ACKNOWLEDGE_RETRIES: String(5),
        COMMAND_DISPATCHER_PROTOCOL: 'http',
        COMMAND_DISPATCHER_HOST_NAME: 'localhost',
        COMMAND_DISPATCHER_PORT: String(portCommandDispatcher),
        REPLAY_SERVER_PROTOCOL: 'http',
        REPLAY_SERVER_HOST_NAME: 'localhost',
        REPLAY_SERVER_PORT: String(portReplay),
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
    if (stopProcess) {
      await stopProcess();
    }
    if (stopProcessAeonstore) {
      await stopProcessAeonstore();
    }
    if (stopReplayServer) {
      await stopReplayServer();
    }
    if (stopProcessDomainEventDispatcher) {
      await stopProcessDomainEventDispatcher();
    }
    if (stopProcessCommandDispatcher) {
      await stopProcessCommandDispatcher();
    }

    stopProcess = undefined;
    stopProcessAeonstore = undefined;
    stopReplayServer = undefined;
    stopProcessCommandDispatcher = undefined;
    stopProcessDomainEventDispatcher = undefined;
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
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'triggeredFlow',
        data: { flowName: 'neverFlow' },
        metadata: { revision: 1 }
      });

      await aeonstoreClient.storeDomainEvents({ domainEvents: [ domainEvent ]});
      await handleDomainEventClient.postDomainEvent({ domainEvent });

      await sleep({ ms: 1500 });

      const lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executeFromFlow',
        data: { fromFlow: 'neverFlow' }
      });
    });

    test('with replay.', async (): Promise<void> => {
      const aggregateId = uuid();
      const domainEvents = [
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
          name: 'triggeredFlow',
          data: { flowName: 'alwaysFlow' },
          metadata: { revision: 1 }
        }),
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
          name: 'triggeredFlow',
          data: { flowName: 'alwaysFlow' },
          metadata: { revision: 2 }
        }),
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
          name: 'triggeredFlow',
          data: { flowName: 'alwaysFlow' },
          metadata: { revision: 3 }
        })
      ];

      await aeonstoreClient.storeDomainEvents({ domainEvents });
      await handleDomainEventClient.postDomainEvent({ domainEvent: domainEvents[2] });

      await sleep({ ms: 1500 });

      let lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executeFromFlow',
        data: { basedOnRevision: 1, fromFlow: 'alwaysFlow' }
      });

      await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });

      lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executeFromFlow',
        data: { basedOnRevision: 2, fromFlow: 'alwaysFlow' }
      });

      await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });

      lock = await commandDispatcherClient.awaitItem();

      assert.that(lock).is.not.undefined();
      assert.that(lock.item).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executeFromFlow',
        data: { basedOnRevision: 3, fromFlow: 'alwaysFlow' }
      });

      await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });
    });
  });
});
