import { errors } from '../errors';
import { isFunction, isObjectLike, isUndefined } from 'lodash';

const validateNotificationHandler = function ({ notificationHandler }: {
  notificationHandler: any;
}): void {
  if (!isObjectLike(notificationHandler)) {
    throw new errors.NotificationHandlerMalformed(`Notification handler is not an object.`);
  }

  if (isUndefined(notificationHandler.isAuthorized)) {
    throw new errors.NotificationHandlerMalformed(`Function 'isAuthorized' is missing.`);
  }
  if (!isFunction(notificationHandler.isAuthorized)) {
    throw new errors.NotificationHandlerMalformed(`Property 'isAuthorized' is not a function.`);
  }

  if (!isUndefined(notificationHandler.getDocumentation)) {
    if (!isFunction(notificationHandler.getDocumentation)) {
      throw new errors.NotificationHandlerMalformed(`Property 'getDocumentation' is not a function.`);
    }
  }

  if (!isUndefined(notificationHandler.getSchema)) {
    if (!isFunction(notificationHandler.getSchema)) {
      throw new errors.NotificationHandlerMalformed(`Property 'getSchema' is not a function.`);
    }
  }
};

export { validateNotificationHandler };
