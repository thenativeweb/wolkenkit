import { NotificationDefinition } from '../elements/NotificationDefinition';

export interface NotificationService {
  publish<TNotificationDefinition extends NotificationDefinition>(
    name: string,
    data: Pick<TNotificationDefinition, 'data'>,
    metadata?: Pick<TNotificationDefinition, 'metadata'>
  ): void | Promise<void>;
}
