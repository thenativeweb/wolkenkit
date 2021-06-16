import { NotificationDefinition } from '../elements/NotificationDefinition';
export interface NotificationService {
    publish: <TNotificationDefinition extends NotificationDefinition>(name: string, data: TNotificationDefinition['data'], metadata?: TNotificationDefinition['metadata']) => void | Promise<void>;
}
