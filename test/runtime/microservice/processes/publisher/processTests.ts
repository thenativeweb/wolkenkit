import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as PublishMessageClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { Client as SubscribeMessagesClient } from '../../../../../lib/apis/subscribeMessages/http/v2/Client';
import { waitForSignals } from 'wait-for-signals';

suite('publisher', function (): void {
  this.timeout(10 * 1000);

  let healthPort: number,
      port: number,
      publishMessageClient: PublishMessageClient,
      stopProcess: (() => Promise<void>) | undefined,
      subscribeMessagesClient: SubscribeMessagesClient;

  setup(async (): Promise<void> => {
    [ port, healthPort ] = await getAvailablePorts({ count: 2 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      port: healthPort,
      env: {
        PORT: String(port),
        HEALTH_PORT: String(healthPort)
      }
    });

    publishMessageClient = new PublishMessageClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/publish/v2'
    });

    subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/subscribe/v2'
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

  suite('publishMessage', (): void => {
    test('forwards messages to subscribers.', async (): Promise<void> => {
      const message = { text: 'Hello world!' };

      setTimeout(async (): Promise<void> => {
        await publishMessageClient.postMessage({ message });
      }, 50);

      const messageStream = await subscribeMessagesClient.getMessages();

      const collector = waitForSignals({ count: 1 });

      messageStream.on('error', async (err): Promise<void> => {
        await collector.fail(err);
      });
      messageStream.pipe(asJsonStream<object>(
        [
          async (receivedEvent): Promise<void> => {
            assert.that(receivedEvent).is.equalTo(message);

            await collector.signal();
          }
        ],
        true
      ));

      await collector.promise;
    });
  });
});
