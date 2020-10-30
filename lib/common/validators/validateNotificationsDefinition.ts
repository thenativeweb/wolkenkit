import { errors } from '../errors';
import { isObjectLike } from 'lodash';
import { validateNotificationHandler } from './validateNotificationHandler';

const validateNotificationsDefinition = function ({ notificationsDefinition }: {
  notificationsDefinition: any;
}): void {
  if (!isObjectLike(notificationsDefinition)) {
    throw new errors.NotificationsDefinitionMalformed('Notifications definition is not an object.');
  }

  for (const [ notificationHandlerName, notificationHandler ] of Object.entries(notificationsDefinition)) {
    try {
      validateNotificationHandler({ notificationHandler });
    } catch (ex: unknown) {
      throw new errors.NotificationsDefinitionMalformed(`Notification handler '${notificationHandlerName}' is malformed: ${(ex as Error).message}`);
    }
  }
};

export { validateNotificationsDefinition };
