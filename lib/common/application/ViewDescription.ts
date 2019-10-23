import { QueryDescription } from './QueryDescription';

export interface ViewDescription {
  queries: Record<string, QueryDescription>;
}
