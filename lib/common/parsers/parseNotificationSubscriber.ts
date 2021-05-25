import { NotificationSubscriber } from '../elements/NotificationSubscriber';
import { error, Result, value } from 'defekt';
import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseNotificationSubscriber = function ({ notificationSubscriber }: {
  notificationSubscriber: any;
}): Result<NotificationSubscriber<any, any>, errors.NotificationSubscriberMalformed> {
  if (!isObjectLike(notificationSubscriber)) {
    return error(new errors.NotificationSubscriberMalformed(`Notification subscriber is not an object.`));
  }

  if (isUndefined(notificationSubscriber.isRelevant)) {
    return error(new errors.NotificationSubscriberMalformed(`Function 'isRelevant' is missing.`));
  }
  if (!isFunction(notificationSubscriber.isRelevant)) {
    return error(new errors.NotificationSubscriberMalformed(`Property 'isRelevant' is not a function.`));
  }

  if (isUndefined(notificationSubscriber.handle)) {
    return error(new errors.NotificationSubscriberMalformed(`Function 'handle' is missing.`));
  }
  if (!isFunction(notificationSubscriber.handle)) {
    return error(new errors.NotificationSubscriberMalformed(`Property 'handle' is not a function.`));
  }

  return value(notificationSubscriber);
};

export { parseNotificationSubscriber };
