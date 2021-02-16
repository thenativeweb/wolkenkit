import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getSocketPaths } from '../../../../shared/getSocketPaths';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Configuration as PublisherConfiguration } from '../../../../../lib/runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition';
import { Client as PublishMessageClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { Client as SubscribeMessagesClient } from '../../../../../lib/apis/subscribeMessages/http/v2/Client';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { waitForSignals } from 'wait-for-signals';

suite('publisher process', function (): void {
  this.timeout(60_000);

  let healthSocket: string,
      publishMessageClient: PublishMessageClient,
      socket: string,
      stopProcess: (() => Promise<void>) | undefined,
      subscribeMessagesClient: SubscribeMessagesClient;

  setup(async (): Promise<void> => {
    [ socket, healthSocket ] = await getSocketPaths({ count: 2 });

    const publisherConfiguration: PublisherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: publisherConfigurationDefinition }),
      portOrSocket: socket,
      healthPortOrSocket: healthSocket
    };

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      portOrSocket: healthSocket,
      env: toEnvironmentVariables({
        configuration: publisherConfiguration,
        configurationDefinition: publisherConfigurationDefinition
      })
    });

    publishMessageClient = new PublishMessageClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/publish/v2'
    });

    subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
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
        portOrSocket: healthSocket,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('publishMessage', (): void => {
    test('forwards messages to subscribers.', async (): Promise<void> => {
      const channel = 'messages',
            message = { text: 'Hello world!' };

      setTimeout(async (): Promise<void> => {
        await publishMessageClient.postMessage({ channel, message });
      }, 50);

      const messageStream = await subscribeMessagesClient.getMessages({ channel });

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
