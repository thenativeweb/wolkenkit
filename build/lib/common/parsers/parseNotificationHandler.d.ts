import { NotificationHandler } from '../elements/NotificationHandler';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseNotificationHandler: ({ notificationHandler }: {
    notificationHandler: any;
}) => Result<NotificationHandler<any, any>, errors.NotificationHandlerMalformed>;
export { parseNotificationHandler };
