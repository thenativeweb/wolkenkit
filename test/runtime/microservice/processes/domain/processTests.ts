import { buildCommand } from '../../../../shared/buildCommand';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { Client as HandleCommandClient } from '../../../../../lib/apis/handleCommand/http/v2/Client';
import path from 'path';
import { Client as QueryDomainEventStoreClient } from '../../../../../lib/apis/queryDomainEventStore/http/v2/Client';
import { startProcess } from '../../../../shared/runtime/startProcess';
import { uuid } from 'uuidv4';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('domain event', function (): void {
  this.timeout(10 * 1000);

  const queueLockExpirationTime = 600;
  const queuePollInterval = 600;

  let dispatcherPort: number,
      domainEventStorePort: number,
      domainPort: number,
      handleCommandClient: HandleCommandClient,
      queryDomainEventStoreClient: QueryDomainEventStoreClient,
      stopDispatcherProcess: (() => Promise<void>) | undefined,
      stopDomainEventStoreProcess: (() => Promise<void>) | undefined,
      stopDomainProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ dispatcherPort, domainEventStorePort, domainPort ] = await getAvailablePorts({ count: 3 });

    stopDispatcherProcess = await startProcess({
      runtime: 'microservice',
      name: 'dispatcher',
      port: dispatcherPort,
      env: {
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":${queueLockExpirationTime}}`,
        PORT: String(dispatcherPort),
        IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`,
        QUEUE_POLL_INTERVAL: String(queuePollInterval)
      }
    });

    handleCommandClient = new HandleCommandClient({
      protocol: 'http',
      hostName: 'localhost',
      port: dispatcherPort,
      path: '/handle-command/v2'
    });

    stopDomainEventStoreProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      port: domainEventStorePort,
      env: {
        PORT: String(domainEventStorePort)
      }
    });

    queryDomainEventStoreClient = new QueryDomainEventStoreClient({
      protocol: 'http',
      hostName: 'localhost',
      port: domainEventStorePort,
      path: '/query/v2'
    });

    stopDomainProcess = await startProcess({
      runtime: 'microservice',
      name: 'domain',
      port: domainPort,
      env: {
        DISPATCHER_PROTOCOL: 'http',
        DISPATCHER_HOST_NAME: 'localhost',
        DISPATCHER_PORT: String(dispatcherPort),
        DISPATCHER_RENEW_INTERVAL: String(5_000),
        DISPATCHER_ACKNOWLEDGE_RETRIES: String(0),
        AEONSTORE_PROTOCOL: 'http',
        AEONSTORE_HOST_NAME: 'localhost',
        AEONSTORE_PORT: String(domainEventStorePort),
        AEONSTORE_RETRIES: String(0),
        PORT: String(domainPort),
        CONCURRENT_COMMANDS: String(1)
      }
    });
  });

  teardown(async (): Promise<void> => {
    if (stopDispatcherProcess) {
      await stopDispatcherProcess();
    }
    if (stopDomainEventStoreProcess) {
      await stopDomainEventStoreProcess();
    }
    if (stopDomainProcess) {
      await stopDomainProcess();
    }

    stopDispatcherProcess = undefined;
    stopDomainEventStoreProcess = undefined;
    stopDomainProcess = undefined;
  });

  suite('validation', (): void => {
    test(`publishes (and does not store) a failed event with validation message if a command's payload doesn't match its handler's schema.`, async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggergate',
        id: uuid()
      };

      const command = buildCommand({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'execute',
        data: {}
      });

      await handleCommandClient.postCommand({ command });

      // Check that event is published.
      // Check that event is not stored.
      await queryDomainEventStoreClient.getLastDomainEvent({ aggregateIdentifier });
    });
  });

  suite('authorization', (): void => {
    test(`publishes (and does not store) a rejected event if the sender of a command is not authorized.`, async (): Promise<void> => {
      // Write this test.
    });
  });

  suite('handling', (): void => {
    test('publishes (and stores) an appropriate event for the incoming command.', async (): Promise<void> => {
      // Write this test.
    });
  });
});
