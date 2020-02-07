import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import axios from 'axios';
import { buildCommandWithMetadata } from 'test/shared/buildCommandWithMetadata';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { startProcess } from '../../../../shared/runtime/startProcess';
import { uuid } from 'uuidv4';

suite('dispatcher', function (): void {
  this.timeout(10 * 1000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const queueLockExpirationTime = 600;

  let healthPort: number,
      port: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ port, healthPort ] = await getAvailablePorts({ count: 2 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'dispatcher',
      port: healthPort,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":${queueLockExpirationTime}}`,
        PORT: String(port),
        HEALTH_PORT: String(healthPort)
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

  suite('GET /await-command/v2', (): void => {
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

      await axios({
        method: 'post',
        url: `http://localhost:${port}/handle-command/v2`,
        data: command
      });

      const { data } = await axios({
        method: 'get',
        url: `http://localhost:${port}/await-command/v2`,
        responseType: 'stream'
      });

      await new Promise((resolve, reject): void => {
        data.on('error', (err: any): void => {
          reject(err);
        });

        data.pipe(asJsonStream([
          (streamElement): void => {
            assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
          },
          (streamElement: any): void => {
            assert.that(streamElement.item).is.equalTo(command);

            resolve();
          }
        ]));
      });
    });
  });
});
