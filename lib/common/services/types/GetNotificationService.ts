import { Notification } from '../../elements/Notification';
import { NotificationService } from '../NotificationService';
import { Publisher } from '../../../messaging/pubSub/Publisher';

export type GetNotificationService = (parameters: {
  channel: string;
  publisher: Publisher<Notification>;
}) => NotificationService;
