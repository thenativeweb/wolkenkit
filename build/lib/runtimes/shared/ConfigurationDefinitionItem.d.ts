import { Schema } from '../../common/elements/Schema';
export interface ConfigurationDefinitionItem<T> {
    environmentVariable: string;
    schema: Schema;
    defaultValue: T;
}
