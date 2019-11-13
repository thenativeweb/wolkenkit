import { DomainEventData } from '../elements/DomainEventData';
import { ProjectionHandler } from '../elements/ProjectionHandler';
import { QueryHandler } from '../elements/QueryHandler';
import { QueryOptions } from '../elements/QueryOptions';
import { QueryResultItem } from '../elements/QueryResultItem';
import { ViewInitializer } from '../elements/ViewInitializer';

export interface ViewDefinition {
  initializer: ViewInitializer<any>;

  projectionHandlers: Record<string, ProjectionHandler<any, DomainEventData>>;

  queryHandlers: Record<string, QueryHandler<any, QueryOptions, QueryResultItem>>;
}
