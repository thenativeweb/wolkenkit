import { NotificationDefinition } from '../elements/NotificationDefinition';

export interface NotificationService {
  send<TNotificationDefinition extends NotificationDefinition>(
    name: string,
    data: Pick<TNotificationDefinition, 'data'>,
    metadata: Pick<TNotificationDefinition, 'metadata'>
  ): void | Promise<void>;
}
