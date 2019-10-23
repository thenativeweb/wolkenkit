import { DomainEventData } from '../elements/DomainEventData';
import { ProjectionHandler } from '../elements/ProjectionHandler';
import { QueryHandler } from '../elements/QueryHandler';
import { ViewStore } from '../elements/ViewStore';

export interface ViewDefinition {
  store: ViewStore<any>;
  projections: Record<string, ProjectionHandler<any, DomainEventData>>;
  queries: Record<string, QueryHandler<any, any, any>>;
}
