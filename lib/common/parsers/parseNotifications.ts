import { isObjectLike } from 'lodash';
import { Notifications } from '../elements/Notifications';
import { parseNotificationHandler } from './parseNotificationHandler';
import { error, Result, value } from 'defekt';
import * as errors from '../errors';

const parseNotifications = function ({ notificationsDefinition }: {
  notificationsDefinition: any;
}): Result<Notifications<any>, errors.NotificationsDefinitionMalformed> {
  if (!isObjectLike(notificationsDefinition)) {
    throw new errors.NotificationsDefinitionMalformed('Notifications definition is not an object.');
  }

  for (const [ notificationHandlerName, notificationHandler ] of Object.entries(notificationsDefinition)) {
    const parseResult = parseNotificationHandler({ notificationHandler });

    if (parseResult.hasError()) {
      return error(new errors.NotificationsDefinitionMalformed(`Notification handler '${notificationHandlerName}' is malformed: ${parseResult.error.message}`));
    }
  }

  return value(notificationsDefinition);
};

export { parseNotifications };
