import { GraphqlIncompatibleSchema } from '../elements/Schema';

export interface QueryDescription {
  documentation?: string;

  optionsSchema?: GraphqlIncompatibleSchema;

  itemSchema?: GraphqlIncompatibleSchema;
}
