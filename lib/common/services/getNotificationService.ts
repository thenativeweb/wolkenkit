import { Application } from '../application/Application';
import { GetNotificationService } from './types/GetNotificationService';
import { Notification } from '../elements/Notification';
import { NotificationService } from './NotificationService';
import { Publisher } from '../../messaging/pubSub/Publisher';
import { validateNotification } from '../validators/validateNotification';

const getNotificationService: GetNotificationService = function ({ application, channel, publisher }: {
  application: Application;
  channel: string;
  publisher: Publisher<Notification>;
}): NotificationService {
  return {
    async publish (name, data, metadata): Promise<void> {
      const notification = {
        name,
        data,
        metadata
      };

      validateNotification({ notification, application });

      await publisher.publish({
        channel,
        message: notification
      });
    }
  };
};

export { getNotificationService };
