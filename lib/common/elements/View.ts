import { AskInfrastructure } from './AskInfrastructure';
import { NotificationDefinition } from './NotificationDefinition';
import { NotificationSubscriber } from './NotificationSubscriber';
import { QueryHandler } from './QueryHandler';
import { QueryResultItem } from './QueryResultItem';
import { ViewEnhancer } from '../../tools/ViewEnhancer';

export interface View {
  queryHandlers: Record<string, QueryHandler<QueryResultItem, AskInfrastructure>>;

  notificationSubscribers: Record<string, NotificationSubscriber<NotificationDefinition, AskInfrastructure>>;

  enhancers?: ViewEnhancer[];
}
