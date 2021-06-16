import { NotificationSubscriber } from '../elements/NotificationSubscriber';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseNotificationSubscriber: ({ notificationSubscriber }: {
    notificationSubscriber: any;
}) => Result<NotificationSubscriber<any, any>, errors.NotificationSubscriberMalformed>;
export { parseNotificationSubscriber };
