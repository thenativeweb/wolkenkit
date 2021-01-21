import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { Configuration } from '../../../../../lib/runtimes/microservice/processes/view/Configuration';
import { configurationDefinition } from '../../../../../lib/runtimes/microservice/processes/view/configurationDefinition';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getSocketPaths } from '../../../../shared/getSocketPaths';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Configuration as PublisherConfiguration } from '../../../../../lib/runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition';
import { Client as PublishMessageClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { Client as QueryViewsClient } from '../../../../../lib/apis/queryView/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { Client as SubscribeMessagesClient } from '../../../../../lib/apis/subscribeMessages/http/v2/Client';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { waitForSignals } from 'wait-for-signals';

suite('view process', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'withHardcodedViews', language: 'javascript' }),
        pubSubChannelForNotifications = 'notifications';

  let healthSocket: string,
      publisherHealthSocket: string,
      publisherSocket: string,
      publishMessagesClient: PublishMessageClient,
      queryViewsClient: QueryViewsClient,
      socket: string,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined,
      subscribeMessagesClient: SubscribeMessagesClient;

  setup(async (): Promise<void> => {
    [ healthSocket, socket, publisherHealthSocket, publisherSocket ] = await getSocketPaths({ count: 4 });

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

    publishMessagesClient = new PublishMessageClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: publisherSocket,
      path: '/publish/v2'
    });

    subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: publisherSocket,
      path: '/subscribe/v2'
    });

    const configuration: Configuration = {
      ...getDefaultConfiguration({ configurationDefinition }),
      applicationDirectory,
      healthPortOrSocket: healthSocket,
      portOrSocket: socket,
      pubSubOptions: {
        channelForNotifications: pubSubChannelForNotifications,
        publisher: {
          type: 'Http',
          protocol: 'http',
          hostName: 'localhost',
          portOrSocket: publisherSocket,
          path: '/publish/v2'
        },
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
      name: 'view',
      enableDebugMode: false,
      portOrSocket: healthSocket,
      env: toEnvironmentVariables({
        configuration,
        configurationDefinition
      })
    });

    queryViewsClient = new QueryViewsClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/views/v2'
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

  suite('views', (): void => {
    test('queries the views.', async (): Promise<void> => {
      const resultStream = await queryViewsClient.query({
        viewName: 'sampleView',
        queryName: 'hardcoded'
      });
      const resultItems = [];

      for await (const resultItem of resultStream) {
        resultItems.push(resultItem);
      }

      assert.that(resultItems).is.equalTo([
        { value: 'foo' },
        { value: 'bar' },
        { value: 'baz' }
      ]);
    });
  });

  suite('notificationSubscribers', (): void => {
    test('react to notifications and publish notifications.', async (): Promise<void> => {
      const messageStreamNotification = await subscribeMessagesClient.getMessages({
        channel: pubSubChannelForNotifications
      });

      await publishMessagesClient.postMessage({
        channel: pubSubChannelForNotifications,
        message: {
          name: 'flowSampleFlowUpdated',
          data: {}
        }
      });

      const counter = waitForSignals({ count: 2 });

      messageStreamNotification.on('error', async (err: any): Promise<void> => {
        await counter.fail(err);
      });
      messageStreamNotification.pipe(asJsonStream(
        [
          async (data): Promise<void> => {
            try {
              assert.that(data).is.atLeast({
                name: 'flowSampleFlowUpdated',
                data: {}
              });
              await counter.signal();
            } catch (ex: unknown) {
              await counter.fail(ex);
            }
          },
          async (data): Promise<void> => {
            try {
              assert.that(data).is.atLeast({
                name: 'viewSampleViewUpdated',
                data: {}
              });
              await counter.signal();
            } catch (ex: unknown) {
              await counter.fail(ex);
            }
          }
        ],
        true
      ));

      await counter.promise;
    });
  });
});
