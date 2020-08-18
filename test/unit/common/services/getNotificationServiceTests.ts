import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../lib/messaging/pubSub/createSubscriber';
import { getNotificationService } from '../../../../lib/common/services/getNotificationService';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { Notification } from '../../../../lib/common/elements/Notification';
import { NotificationService } from '../../../../lib/common/services/NotificationService';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';

suite('getNotificationService', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let application: Application,
      notificationService: NotificationService,
      publisher: Publisher<Notification>,
      pubSubChannelForNotifications: string,
      subscriber: Subscriber<Notification>;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });
  });

  setup(async (): Promise<void> => {
    publisher = await createPublisher<Notification>({ type: 'InMemory' });
    subscriber = await createSubscriber<Notification>({ type: 'InMemory' });
    pubSubChannelForNotifications = 'notifications';

    notificationService = getNotificationService({
      application,
      publisher,
      channel: pubSubChannelForNotifications
    });
  });

  suite('publish', (): void => {
    test('throws an error if the published notification name is unknown.', async (): Promise<void> => {
      const unknownNotificationName = 'someUnknownNotification';

      await assert.that(async (): Promise<void> => {
        await notificationService.publish(unknownNotificationName, {});
      }).is.throwingAsync(`Notification '${unknownNotificationName}' not found.`);
    });

    test(`throws an error if the published notification's data does not match its schema.`, async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await notificationService.publish('complex', {});
      }).is.throwingAsync('Missing required property: message (at notification.data.message).');
    });

    test(`throws an error if the published notification's metadata does not match its schema.`, async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await notificationService.publish('complex', { message: 'foo' }, {});
      }).is.throwingAsync('Missing required property: public (at notification.metadata.public).');
    });

    test('publishes the notification if everything is fine.', async (): Promise<void> => {
      const notifications: Notification[] = [];

      await subscriber.subscribe({
        channel: pubSubChannelForNotifications,
        callback (notification: Notification): void {
          notifications.push(notification);
        }
      });

      await notificationService.publish('complex', { message: 'foo' }, { public: true });

      assert.that(notifications.length).is.equalTo(1);
      assert.that(notifications[0]).is.equalTo({
        name: 'complex',
        data: { message: 'foo' },
        metadata: { public: true }
      });
    });
  });
});
