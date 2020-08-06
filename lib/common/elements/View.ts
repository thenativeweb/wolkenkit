import { AskInfrastructure } from './AskInfrastructure';
import { NotificationDefinition } from './NotificationDefinition';
import { NotificationListener } from './NotificationListener';
import { QueryHandler } from './QueryHandler';
import { QueryResultItem } from './QueryResultItem';
import { ViewEnhancer } from '../../tools/ViewEnhancer';

export interface View {
  queryHandlers: Record<string, QueryHandler<QueryResultItem, AskInfrastructure>>;

  notificationListeners: Record<string, NotificationListener<NotificationDefinition, AskInfrastructure>>;

  enhancers?: ViewEnhancer[];
}
