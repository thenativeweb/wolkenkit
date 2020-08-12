import { Application } from 'express';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../lib/messaging/pubSub/createSubscriber';
import { getApi } from '../../../../lib/apis/subscribeNotifications/http';
import { Notification } from '../../../../lib/common/elements/Notification';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { runAsServer } from '../../../shared/http/runAsServer';
import { sleep } from '../../../../lib/common/utils/sleep';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';

suite('subscribeNotifications/http', (): void => {
  suite('/v2', (): void => {
    suite('GET /', function (): void {
      this.timeout(5_000);

      const channelForNotifications = 'notifications';

      let api: Application,
          publisher: Publisher<Notification>,
          subscriber: Subscriber<Notification>;

      setup(async (): Promise<void> => {
        publisher = await createPublisher<Notification>({ type: 'InMemory' });
        subscriber = await createSubscriber<Notification>({ type: 'InMemory' });

        ({ api } = await getApi({ corsOrigin: '*', subscriber, channelForNotifications }));
      });

      test('delivers a single notification.', async (): Promise<void> => {
        const notification = {
          name: 'sampleNotification',
          data: {}
        };

        setTimeout(async (): Promise<void> => {
          await publisher.publish({ channel: channelForNotifications, message: notification });
        }, 100);

        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: `/v2/`,
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement).is.equalTo(notification);
              resolve();
            }
          ]));
        });
      });

      test('delivers multiple notifications.', async (): Promise<void> => {
        const notificationFirst = { name: 'sampleNotification', data: { number: 1 }},
              notificationSecond = { name: 'sampleNotification', data: { number: 2 }};

        setTimeout(async (): Promise<void> => {
          await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
          await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
        }, 100);

        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: `/v2/`,
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement).is.equalTo(notificationFirst);
            },
            (streamElement: any): void => {
              assert.that(streamElement).is.equalTo(notificationSecond);
              resolve();
            }
          ]));
        });
      });

      test('gracefully handles connections that get closed by the client.', async (): Promise<void> => {
        const notification = { name: 'sampleNotification', data: {}};
        const { client } = await runAsServer({ app: api });

        try {
          await client({
            method: 'get',
            url: `/v2/`,
            responseType: 'stream',
            timeout: 100
          });
        } catch (ex) {
          if (ex.code !== 'ECONNABORTED') {
            throw ex;
          }

          // Ignore aborted connections, since that's what we want to achieve
          // here.
        }

        await sleep({ ms: 50 });

        await assert.that(async (): Promise<void> => {
          await publisher.publish({ channel: channelForNotifications, message: notification });
        }).is.not.throwingAsync();
      });
    });
  });
});
