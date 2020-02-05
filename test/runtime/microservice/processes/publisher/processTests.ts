import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import axios from 'axios';
import { getAvailablePort } from '../../../../../lib/common/utils/network/getAvailablePort';
import { startProcess } from '../../../../shared/runtime/startProcess';

suite('publisher', function (): void {
  this.timeout(10 * 1000);

  let port: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    port = await getAvailablePort();

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      port,
      env: {
        PORT: String(port)
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

  suite('POST /publish/v2', (): void => {
    test('forwards messages to subscribers.', async (): Promise<void> => {
      const message = { text: 'Hello world!' };

      setTimeout(async (): Promise<void> => {
        const { status } = await axios({
          method: 'post',
          url: `http://localhost:${port}/publish/v2`,
          data: message
        });

        assert.that(status).is.equalTo(200);
      }, 50);

      await new Promise(async (resolve, reject): Promise<void> => {
        try {
          const { data } = await axios({
            method: 'get',
            url: `http://localhost:${port}/subscribe/v2`,
            responseType: 'stream'
          });

          data.pipe(asJsonStream<object>([
            (receivedEvent): void => {
              assert.that(receivedEvent).is.equalTo({ name: 'heartbeat' });
            },
            (receivedEvent): void => {
              assert.that(receivedEvent).is.equalTo(message);
              resolve();
            }
          ]));
        } catch (ex) {
          reject(ex);
        }
      });
    });
  });
});
