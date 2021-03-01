import { Application } from '../application/Application';
import { errors } from '../errors';
import { flaschenpost } from 'flaschenpost';
import { LoggerService } from '../services/LoggerService';
import { Notification } from '../elements/Notification';
import { NotificationService } from '../services/NotificationService';
import { withLogMetadata } from '../utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const executeNotificationSubscribers = async function ({ application, notification, viewName, services }: {
  application: Application;
  notification: Notification;
  viewName: string;
  services: {
    logger: LoggerService;
    notification: NotificationService;
  };
}): Promise<void> {
  if (!(viewName in application.views)) {
    throw new errors.ViewNotFound(`View '${viewName}' not found.`);
  }

  const viewDefinition = application.views[viewName];

  if (!viewDefinition.notificationSubscribers) {
    return;
  }

  for (const [ notificationSubscriberName, notificationSubscriber ] of Object.entries(viewDefinition.notificationSubscribers)) {
    if (!notificationSubscriber.isRelevant({ name: notification.name })) {
      continue;
    }
    try {
      await notificationSubscriber.handle(
        notification.data,
        {
          ...services,
          infrastructure: application.infrastructure
        }
      );
    } catch (ex: unknown) {
      logger.error(
        `A notification subscriber threw an error.`,
        withLogMetadata('common', 'executeNotificationSubscriber', { error: ex, viewName, notificationSubscriberName })
      );

      throw ex;
    }
  }
};

export { executeNotificationSubscribers };
