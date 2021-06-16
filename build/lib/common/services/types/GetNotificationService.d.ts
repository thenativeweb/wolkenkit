import { Application } from '../../application/Application';
import { Notification } from '../../elements/Notification';
import { NotificationService } from '../NotificationService';
import { Publisher } from '../../../messaging/pubSub/Publisher';
export declare type GetNotificationService = (parameters: {
    application: Application;
    channel: string;
    publisher: Publisher<Notification>;
}) => NotificationService;
