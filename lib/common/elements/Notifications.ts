import { AskInfrastructure } from './AskInfrastructure';
import { NotificationDefinition } from './NotificationDefinition';
import { NotificationHandler } from './NotificationHandler';

export type Notifications = Record<string, NotificationHandler<NotificationDefinition, AskInfrastructure>>;
