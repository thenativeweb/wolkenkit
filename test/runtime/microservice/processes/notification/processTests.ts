import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { Configuration } from '../../../../../lib/runtimes/microservice/processes/notification/Configuration';
import { configurationDefinition } from '../../../../../lib/runtimes/microservice/processes/notification/configurationDefinition';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getSocketPaths } from '../../../../shared/getSocketPaths';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Configuration as PublisherConfiguration } from '../../../../../lib/runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition';
import { Client as PublishMessageClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { Client as SubscribeNotificationsClient } from '../../../../../lib/apis/subscribeNotifications/http/v2/Client';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { waitForSignals } from 'wait-for-signals';

suite('notification process', function (): void {
  this.timeout(60_000);

  const pubsubChannelForNotifications = 'notifications';

  let healthSocket: string,
      publisherHealthSocket: string,
      publisherSocket: string,
      publishMessageClient: PublishMessageClient,
      socket: string,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined,
      subscribeNotificationsClient: SubscribeNotificationsClient;

  setup(async (): Promise<void> => {
    [ socket, healthSocket, publisherSocket, publisherHealthSocket ] = await getSocketPaths({ count: 4 });

    const publisherConfiguration: PublisherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: publisherConfigurationDefinition }),
      portOrSocket: publisherSocket,
      healthPortOrSocket: publisherHealthSocket
    };

    stopProcessPublisher = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      portOrSocket: publisherHealthSocket,
      env: toEnvironmentVariables({
        configuration: publisherConfiguration,
        configurationDefinition: publisherConfigurationDefinition
      })
    });

    publishMessageClient = new PublishMessageClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: publisherSocket,
      path: '/publish/v2'
    });

    const configuration: Configuration = {
      ...getDefaultConfiguration({ configurationDefinition }),
      healthPortOrSocket: healthSocket,
      portOrSocket: socket,
      pubSubOptions: {
        channelForNotifications: pubsubChannelForNotifications,
        subscriber: {
          type: 'Http',
          protocol: 'http',
          hostName: 'localhost',
          portOrSocket: publisherSocket,
          path: '/subscribe/v2'
        }
      }
    };

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'notification',
      enableDebugMode: false,
      portOrSocket: healthSocket,
      env: toEnvironmentVariables({
        configuration,
        configurationDefinition
      })
    });

    subscribeNotificationsClient = new SubscribeNotificationsClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/notifications/v2'
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }
    if (stopProcessPublisher) {
      await stopProcessPublisher();
    }

    stopProcess = undefined;
    stopProcessPublisher = undefined;
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

  suite('notifications', (): void => {
    test('streams notifications that come from the publisher.', async (): Promise<void> => {
      const notification = { name: 'complex', data: { message: '1' }, metadata: { public: true }};

      setTimeout(async (): Promise<void> => {
        await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notification });
      }, 50);

      const messageStream = await subscribeNotificationsClient.getNotifications();

      const collector = waitForSignals({ count: 1 });

      messageStream.on('error', async (err): Promise<void> => {
        await collector.fail(err);
      });
      messageStream.pipe(asJsonStream<object>(
        [
          async (receivedEvent): Promise<void> => {
            assert.that(receivedEvent).is.equalTo({ name: notification.name, data: notification.data });

            await collector.signal();
          }
        ],
        true
      ));

      await collector.promise;
    });

    test('only streams authorized notifications.', async (): Promise<void> => {
      const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: false }},
            notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

      setTimeout(async (): Promise<void> => {
        await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notificationFirst });
        await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notificationSecond });
      }, 50);

      const messageStream = await subscribeNotificationsClient.getNotifications();

      const collector = waitForSignals({ count: 1 });

      messageStream.on('error', async (err): Promise<void> => {
        await collector.fail(err);
      });
      messageStream.pipe(asJsonStream<object>(
        [
          async (receivedEvent): Promise<void> => {
            assert.that(receivedEvent).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });

            await collector.signal();
          }
        ],
        true
      ));

      await collector.promise;
    });

    test('drops invalid notifications.', async (): Promise<void> => {
      const notificationFirst = { name: 'complex', data: { foo: 'bar' }, metadata: { public: true }},
            notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

      setTimeout(async (): Promise<void> => {
        await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notificationFirst });
        await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notificationSecond });
      }, 50);

      const messageStream = await subscribeNotificationsClient.getNotifications();

      const collector = waitForSignals({ count: 1 });

      messageStream.on('error', async (err): Promise<void> => {
        await collector.fail(err);
      });
      messageStream.pipe(asJsonStream<object>(
        [
          async (receivedEvent): Promise<void> => {
            assert.that(receivedEvent).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });

            await collector.signal();
          }
        ],
        true
      ));

      await collector.promise;
    });
  });
});
