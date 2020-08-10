import { GetNotificationService } from './types/GetNotificationService';
import { Notification } from '../elements/Notification';
import { NotificationService } from './NotificationService';
import { Publisher } from '../../messaging/pubSub/Publisher';

const getNotificationService: GetNotificationService = function ({ channel, publisher }: {
  channel: string;
  publisher: Publisher<Notification>;
}): NotificationService {
  return {
    async publish (name, data, metadata): Promise<void> {
      await publisher.publish({
        channel,
        message: {
          name, data, metadata
        }
      });
    }
  };
};

export { getNotificationService };
