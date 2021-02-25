import { Application } from '../../../../lib/common/application/Application';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/subscribeNotifications/http/v2/Client';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../lib/messaging/pubSub/createSubscriber';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/subscribeNotifications/http';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { Notification } from '../../../../lib/common/elements/Notification';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';

suite('subscribeNotifications/http/Client', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' }),
        channelForNotifications = 'notifications',
        heartbeatInterval = 90_000,
        identityProviders = [ identityProvider ];

  let api: ExpressApplication,
      application: Application,
      publisher: Publisher<Notification>,
      subscriber: Subscriber<Notification>;

  setup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });

    publisher = await createPublisher<Notification>({ type: 'InMemory' });
    subscriber = await createSubscriber<Notification>({ type: 'InMemory' });

    ({ api } = await getApi({
      application,
      corsOrigin: '*',
      identityProviders,
      subscriber,
      channelForNotifications,
      heartbeatInterval
    }));
  });

  suite('/v2', (): void => {
    suite('getDescription', (): void => {
      test(`returns the notifications' descriptions.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getDescription();

        const { notifications: notificationsDescription } = getApplicationDescription({
          application
        });

        // Convert and parse as JSON, to get rid of any values that are undefined.
        // This is what the HTTP API does internally, and here we need to simulate
        // this to make things work.
        const expectedNotificationsDescription =
            JSON.parse(JSON.stringify(notificationsDescription));

        assert.that(data).is.equalTo(expectedNotificationsDescription);
      });
    });

    suite('getNotifications', (): void => {
      test('delivers a single notification.', async (): Promise<void> => {
        const notification = { name: 'flowSampleFlowUpdated', data: {}};

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          await publisher.publish({ channel: channelForNotifications, message: notification });
        }, 100);

        const data = await client.getNotifications();

        await new Promise<void>((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement).is.equalTo(notification);
                resolve();
              }
            ],
            true
          ));
        });
      });

      test('delivers multiple notifications.', async (): Promise<void> => {
        const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: true }},
              notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
          await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
        }, 100);

        const data = await client.getNotifications();

        await new Promise<void>((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement).is.equalTo({ name: notificationFirst.name, data: notificationFirst.data });
              },
              (streamElement: any): void => {
                assert.that(streamElement).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
                resolve();
              }
            ],
            true
          ));
        });
      });
    });
  });
});
