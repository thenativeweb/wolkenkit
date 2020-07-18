import { AskInfrastructure } from '../elements/AskInfrastructure';
import { QueryHandler } from '../elements/QueryHandler';
import { QueryResultItem } from '../elements/QueryResultItem';

export interface ViewDefinition {
  queryHandlers: Record<string, QueryHandler<QueryResultItem, AskInfrastructure>>;
}
