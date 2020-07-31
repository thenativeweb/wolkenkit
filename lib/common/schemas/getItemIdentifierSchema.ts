import { jsonSchema } from '../utils/uuid';
import { Schema } from '../elements/Schema';

const getItemIdentifierSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      contextIdentifier: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' }
        },
        required: [ 'name' ],
        additionalProperties: false
      },
      aggregateIdentifier: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' },
          id: jsonSchema
        },
        required: [ 'name', 'id' ],
        additionalProperties: false
      },
      id: jsonSchema,
      name: { type: 'string', minLength: 1, format: 'alphanumeric' }
    },
    required: [
      'contextIdentifier',
      'aggregateIdentifier',
      'id',
      'name'
    ],
    additionalProperties: false
  };
};

export { getItemIdentifierSchema };
