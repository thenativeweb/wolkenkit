import { Application } from '../../../../lib/common/application/Application';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/subscribeNotifications/http/v2/Client';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../lib/messaging/pubSub/createSubscriber';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/subscribeNotifications/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { Notification } from '../../../../lib/common/elements/Notification';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';

suite('subscribeNotifications/http/Client', (): void => {
  suite('/v2', (): void => {
    suite('getNotifications', (): void => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' }),
            channelForNotifications = 'notifications',
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
          channelForNotifications
        }));
      });

      test('delivers a single notification.', async (): Promise<void> => {
        const notification = { name: 'flowSampleFlowUpdated', data: {}};

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          await publisher.publish({ channel: channelForNotifications, message: notification });
        }, 100);

        const data = await client.getNotifications();

        await new Promise((resolve, reject): void => {
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
          await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
        }, 100);

        const data = await client.getNotifications();

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement).is.equalTo(notificationFirst);
              },
              (streamElement: any): void => {
                assert.that(streamElement).is.equalTo(notificationSecond);
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
