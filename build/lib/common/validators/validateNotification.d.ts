import { Application } from '../application/Application';
import { Notification } from '../elements/Notification';
declare const validateNotification: ({ notification, application }: {
    notification: Notification;
    application: Application;
}) => void;
export { validateNotification };
