import { Application } from '../../../../lib/common/application/Application';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
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
import { sleep } from '../../../../lib/common/utils/sleep';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';

suite('subscribeNotifications/http', (): void => {
  suite('/v2', (): void => {
    suite('GET /', function (): void {
      this.timeout(5_000);

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
        const notification = {
          name: 'flowSampleFlowUpdated',
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

      test('delivers only authorized notifications.', async (): Promise<void> => {
        const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: false }},
              notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

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
              assert.that(streamElement).is.equalTo({
                name: notificationSecond.name,
                data: notificationSecond.data
              });
              resolve();
            }
          ]));
        });
      });

      test('does not deliver unknown notifications.', async (): Promise<void> => {
        const notificationFirst = { name: 'non-existent', data: {}},
              notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

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
              assert.that(streamElement).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
              resolve();
            }
          ]));
        });
      });

      test('does not deliver invalid notifications.', async (): Promise<void> => {
        const notificationFirst = { name: 'complex', data: { foo: 'bar' }},
              notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

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
              assert.that(streamElement).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
              resolve();
            }
          ]));
        });
      });

      test('delivers multiple notifications.', async (): Promise<void> => {
        const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: true }},
              notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

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
              assert.that(streamElement).is.equalTo({ name: notificationFirst.name, data: notificationFirst.data });
            },
            (streamElement: any): void => {
              assert.that(streamElement).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
              resolve();
            }
          ]));
        });
      });

      test('gracefully handles connections that get closed by the client.', async (): Promise<void> => {
        const notification = { name: 'flowSampleFlowUpdated', data: {}};
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
