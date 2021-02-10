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

  if (!isUndefined(notificationHandler.getDocumentation) && !isFunction(notificationHandler.getDocumentation)) {
    throw new errors.NotificationHandlerMalformed(`Property 'getDocumentation' is not a function.`);
  }

  if (!isUndefined(notificationHandler.getDataSchema) && !isFunction(notificationHandler.getDataSchema)) {
    throw new errors.NotificationHandlerMalformed(`Property 'getDataSchema' is not a function.`);
  }

  if (!isUndefined(notificationHandler.getMetadataSchema) && !isFunction(notificationHandler.getMetadataSchema)) {
    throw new errors.NotificationHandlerMalformed(`Property 'getMetadataSchema' is not a function.`);
  }
};

export { validateNotificationHandler };
