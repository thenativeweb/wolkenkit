import { errors } from '../errors';
import { isFunction, isObjectLike, isUndefined } from 'lodash';

const validateNotificationSubscriber = function ({ notificationSubscriber }: {
  notificationSubscriber: any;
}): void {
  if (!isObjectLike(notificationSubscriber)) {
    throw new errors.NotificationSubscriberMalformed(`Notification subscriber is not an object.`);
  }

  if (isUndefined(notificationSubscriber.isRelevant)) {
    throw new errors.NotificationSubscriberMalformed(`Function 'isRelevant' is missing.`);
  }
  if (!isFunction(notificationSubscriber.isRelevant)) {
    throw new errors.NotificationSubscriberMalformed(`Property 'isRelevant' is not a function.`);
  }

  if (isUndefined(notificationSubscriber.handle)) {
    throw new errors.NotificationSubscriberMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(notificationSubscriber.handle)) {
    throw new errors.NotificationSubscriberMalformed(`Property 'handle' is not a function.`);
  }
};

export { validateNotificationSubscriber };
