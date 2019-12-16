import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import axios from 'axios';
import { buildCommandWithMetadata } from 'test/shared/buildCommandWithMetadata';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import path from 'path';
import { startProcess } from '../../../../shared/runtime/startProcess';
import { uuid } from 'uuidv4';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('dispatcher', function (): void {
  this.timeout(10 * 1000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const queueLockExpirationTime = 600;
  const queuePollInterval = 600;

  let port: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ port ] = await getAvailablePorts({ count: 1 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'dispatcher',
      port,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        PRIORITY_QUEUE_STORE_OPTIONS: `{"expirationTime":${queueLockExpirationTime}}`,
        PORT: String(port),
        IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`,
        QUEUE_POLL_INTERVAL: String(queuePollInterval)
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
      const { status } = await axios({
        method: 'get',
        url: `http://localhost:${port}/health/v2`
      });

      assert.that(status).is.equalTo(200);
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

        data.pipe(asJsonStream(
          (streamElement): void => {
            assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
          },
          (streamElement: any): void => {
            assert.that(streamElement.item).is.equalTo(command);

            resolve();
          }
        ));
      });
    });
  });
});
