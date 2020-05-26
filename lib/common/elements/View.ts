import { QueryHandler } from './QueryHandler';
import { QueryOptions } from './QueryOptions';
import { QueryResultItem } from './QueryResultItem';
import { ViewEnhancer } from '../../tools/ViewEnhancer';

export interface View<TInfrastructure> {
  queryHandlers: Record<string, QueryHandler<QueryOptions, QueryResultItem, TInfrastructure>>;

  enhancers?: ViewEnhancer[];
}
