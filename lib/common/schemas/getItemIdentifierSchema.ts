import { jsonSchema } from 'uuidv4';
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
          id: jsonSchema.v4 as Schema
        },
        required: [ 'name', 'id' ],
        additionalProperties: false
      },
      id: jsonSchema.v4 as Schema,
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
