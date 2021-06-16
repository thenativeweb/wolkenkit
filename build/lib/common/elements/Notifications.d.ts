import { AskInfrastructure } from './AskInfrastructure';
import { NotificationDefinition } from './NotificationDefinition';
import { NotificationHandler } from './NotificationHandler';
import { TellInfrastructure } from './TellInfrastructure';
export declare type Notifications<TInfrastructure extends AskInfrastructure & TellInfrastructure, TNotifications extends Record<string, NotificationDefinition> = Record<string, any>> = {
    [notificationName in keyof TNotifications]: NotificationHandler<TNotifications[notificationName], TInfrastructure>;
};
