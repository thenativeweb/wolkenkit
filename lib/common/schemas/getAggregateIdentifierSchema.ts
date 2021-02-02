import { Schema } from '../elements/Schema';

const getAggregateIdentifierSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      context: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' }
        },
        required: [ 'name' ],
        additionalProperties: false
      },
      aggregate: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' },
          id: { type: 'string', format: 'uuid' }
        },
        required: [ 'name', 'id' ],
        additionalProperties: false
      }
    },
    required: [ 'context', 'aggregate' ],
    additionalProperties: false
  };
};

export { getAggregateIdentifierSchema };
