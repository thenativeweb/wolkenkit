import { DomainEventData } from './DomainEventData';
import { ProjectionHandler } from './ProjectionHandler';
import { QueryHandler } from './QueryHandler';
import { QueryOptions } from './QueryOptions';
import { QueryResultItem } from './QueryResultItem';
import { ViewEnhancer } from '../../tools/ViewEnhancer';
import { ViewInitializer } from './ViewInitializer';

export interface View<TDataAdapter> {
  initializer: ViewInitializer<TDataAdapter>;

  projectionHandlers: Record<string, ProjectionHandler<TDataAdapter, DomainEventData>>;

  queryHandlers: Record<string, QueryHandler<TDataAdapter, QueryOptions, QueryResultItem>>;

  enhancers?: ViewEnhancer[];
}
