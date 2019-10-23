import { DomainEventData } from './DomainEventData';
import { ProjectionHandler } from './ProjectionHandler';
import { QueryHandler } from './QueryHandler';
import { ViewStore } from './ViewStore';

export interface ViewDefinition {
  store: ViewStore<any>;
  projections: Record<string, ProjectionHandler<any, DomainEventData>>;
  queries: Record<string, QueryHandler<any, any, any>>;
}
