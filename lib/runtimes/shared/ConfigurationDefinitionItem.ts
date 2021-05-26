import { GraphqlIncompatibleSchema } from '../../common/elements/Schema';

export interface ConfigurationDefinitionItem<T> {
  environmentVariable: string;
  schema: GraphqlIncompatibleSchema;
  defaultValue: T;
}
