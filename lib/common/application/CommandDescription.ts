import { GraphqlIncompatibleSchema } from '../elements/Schema';

export interface CommandDescription {
  documentation?: string;

  schema?: GraphqlIncompatibleSchema;
}
