import { jsonSchema } from '../utils/uuid';
import { Schema } from '../elements/Schema';

const getAggregateIdentifierSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, format: 'alphanumeric' },
      id: jsonSchema
    },
    required: [ 'name', 'id' ],
    additionalProperties: false
  };
};

export { getAggregateIdentifierSchema };
