import { Notifications } from '../elements/Notifications';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseNotifications: ({ notificationsDefinition }: {
    notificationsDefinition: any;
}) => Result<Notifications<any>, errors.NotificationsDefinitionMalformed>;
export { parseNotifications };
