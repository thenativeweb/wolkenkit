import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import axios from 'axios';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { startProcess } from '../../../../shared/runtime/startProcess';

suite('publisher', function (): void {
  this.timeout(10 * 1000);

  let healthPort: number,
      port: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ port, healthPort ] = await getAvailablePorts({ count: 2 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      port: healthPort,
      env: {
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
