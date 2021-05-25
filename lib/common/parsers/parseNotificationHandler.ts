import { NotificationHandler } from '../elements/NotificationHandler';
import { error, Result, value } from 'defekt';
import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseNotificationHandler = function ({ notificationHandler }: {
  notificationHandler: any;
}): Result<NotificationHandler<any, any>, errors.NotificationHandlerMalformed> {
  if (!isObjectLike(notificationHandler)) {
    return error(new errors.NotificationHandlerMalformed(`Notification handler is not an object.`));
  }

  if (isUndefined(notificationHandler.isAuthorized)) {
    return error(new errors.NotificationHandlerMalformed(`Function 'isAuthorized' is missing.`));
  }
  if (!isFunction(notificationHandler.isAuthorized)) {
    return error(new errors.NotificationHandlerMalformed(`Property 'isAuthorized' is not a function.`));
  }

  if (!isUndefined(notificationHandler.getDocumentation) && !isFunction(notificationHandler.getDocumentation)) {
    return error(new errors.NotificationHandlerMalformed(`Property 'getDocumentation' is not a function.`));
  }

  if (!isUndefined(notificationHandler.getDataSchema) && !isFunction(notificationHandler.getDataSchema)) {
    return error(new errors.NotificationHandlerMalformed(`Property 'getDataSchema' is not a function.`));
  }

  if (!isUndefined(notificationHandler.getMetadataSchema) && !isFunction(notificationHandler.getMetadataSchema)) {
    return error(new errors.NotificationHandlerMalformed(`Property 'getMetadataSchema' is not a function.`));
  }

  return value(notificationHandler);
};

export { parseNotificationHandler };
