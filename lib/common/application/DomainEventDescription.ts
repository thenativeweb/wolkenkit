import { GraphqlIncompatibleSchema } from '../elements/Schema';

export interface DomainEventDescription {
  documentation?: string;

  schema?: GraphqlIncompatibleSchema;
}
