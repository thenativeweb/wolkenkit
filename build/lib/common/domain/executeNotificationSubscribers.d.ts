import { Application } from '../application/Application';
import { LoggerService } from '../services/LoggerService';
import { Notification } from '../elements/Notification';
import { NotificationService } from '../services/NotificationService';
declare const logger: import("flaschenpost/build/lib/Logger").Logger;
declare const executeNotificationSubscribers: ({ application, notification, viewName, services }: {
    application: Application;
    notification: Notification;
    viewName: string;
    services: {
        logger: LoggerService;
        notification: NotificationService;
    };
}) => Promise<void>;
export { executeNotificationSubscribers };
