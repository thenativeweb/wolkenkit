import { AskInfrastructure } from '../elements/AskInfrastructure';
import { NotificationDefinition } from '../elements/NotificationDefinition';
import { NotificationHandler } from '../elements/NotificationHandler';

export type NotificationsDefinition = Record<string, NotificationHandler<NotificationDefinition, AskInfrastructure>>;
