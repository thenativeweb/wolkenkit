import { Schema } from '../elements/Schema';
export interface QueryDescription {
    documentation?: string;
    optionsSchema?: Schema;
    itemSchema?: Schema;
}
