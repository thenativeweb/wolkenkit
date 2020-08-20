import { AskInfrastructure } from '../elements/AskInfrastructure';
import { NotificationDefinition } from '../elements/NotificationDefinition';
import { NotificationSubscriber } from '../elements/NotificationSubscriber';
import { QueryHandler } from '../elements/QueryHandler';
import { QueryResultItem } from '../elements/QueryResultItem';

export interface ViewDefinition {
  queryHandlers: Record<string, QueryHandler<QueryResultItem, AskInfrastructure>>;

  notificationSubscribers?: Record<string, NotificationSubscriber<NotificationDefinition, AskInfrastructure>>;
}
