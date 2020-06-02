import { jsonSchema } from 'uuidv4';
import { Schema } from '../elements/Schema';

const getAggregateIdentifierSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, format: 'alphanumeric' },
      id: jsonSchema.v4 as Schema
    },
    required: [ 'name', 'id' ],
    additionalProperties: false
  };
};

export { getAggregateIdentifierSchema };
