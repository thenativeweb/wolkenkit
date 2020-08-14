import { Application } from '../application/Application';
import { errors } from '../errors';
import { GetNotificationService } from './types/GetNotificationService';
import { Notification } from '../elements/Notification';
import { NotificationService } from './NotificationService';
import { Publisher } from '../../messaging/pubSub/Publisher';
import { Value } from 'validate-value';

const getNotificationService: GetNotificationService = function ({ application, channel, publisher }: {
  application: Application;
  channel: string;
  publisher: Publisher<Notification>;
}): NotificationService {
  return {
    async publish (name, data, metadata): Promise<void> {
      if (!(name in application.notifications)) {
        throw new errors.NotificationNotFound(`Failed to publish unknown notification '${name}'.`);
      }

      const notificationHandler = application.notifications[name];

      if (notificationHandler.getDataSchema) {
        const schema = notificationHandler.getDataSchema();
        const value = new Value(schema);

        value.validate(data, { valueName: 'notification.data' });
      }
      if (notificationHandler.getMetadataSchema) {
        const schema = notificationHandler.getMetadataSchema();
        const value = new Value(schema);

        value.validate(metadata, { valueName: 'notification.metadata' });
      }

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
