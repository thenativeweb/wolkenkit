import { NotificationDefinition } from '../../elements/NotificationDefinition';
import { NotificationService } from '../NotificationService';

export type GetNotificationService = (parameters: {
  publishNotification: (<TNotificationDefinition extends NotificationDefinition>(
    name: string,
    data: TNotificationDefinition['data'],
    metadata?: TNotificationDefinition['metadata']
  ) => void | Promise<void>);
}) => NotificationService;
