import { AskInfrastructure } from './AskInfrastructure';
import { QueryHandler } from './QueryHandler';
import { QueryResultItem } from './QueryResultItem';
import { ViewEnhancer } from '../../tools/ViewEnhancer';

export interface View {
  queryHandlers: Record<string, QueryHandler<QueryResultItem, AskInfrastructure>>;

  enhancers?: ViewEnhancer[];
}
