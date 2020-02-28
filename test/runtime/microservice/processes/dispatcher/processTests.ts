import { assert } from 'assertthat';
import { Client as AwaitCommandClient } from '../../../../../lib/apis/awaitCommandWithMetadata/http/v2/Client';
import { buildCommandWithMetadata } from '../../../../shared/buildCommandWithMetadata';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleCommandWithMetadataClient } from '../../../../../lib/apis/handleCommandWithMetadata/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { uuid } from 'uuidv4';

suite('dispatcher', function (): void {
  this.timeout(10 * 1000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const queueLockExpirationTime = 600;

  let awaitCommandClient: AwaitCommandClient,
      handleCommandWithMetadataClient: HandleCommandWithMetadataClient,
      healthPort: number,
      port: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ port, healthPort ] = await getAvailablePorts({ count: 2 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'dispatcher',
      enableDebugMode: false,
      port: healthPort,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":${queueLockExpirationTime}}`,
        PORT: String(port),
        HEALTH_PORT: String(healthPort)
      }
    });

    awaitCommandClient = new AwaitCommandClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/await-command/v2'
    });

    handleCommandWithMetadataClient = new HandleCommandWithMetadataClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/handle-command/v2'
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }

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

  suite('awaitCommand', (): void => {
    test('delivers a command that is sent to /handle-command/v2.', async (): Promise<void> => {
      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      await handleCommandWithMetadataClient.postCommand({ command });

      const lock = await awaitCommandClient.awaitCommandWithMetadata();

      assert.that(lock.item).is.equalTo(command);
    });
  });
});
