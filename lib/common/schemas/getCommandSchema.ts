import { regex } from 'uuidv4';
import { Schema } from '../elements/Schema';
import { Value } from 'validate-value';

// eslint-disable-next-line @typescript-eslint/no-base-to-string
const uuidRegex = regex.v4.toString().slice(1, -1);

const getSchema = function (): Schema {
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
          id: { type: 'string', pattern: uuidRegex }
        },
        required: [ 'name', 'id' ],
        additionalProperties: false
      },
      name: { type: 'string', minLength: 1, format: 'alphanumeric' },
      data: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: true
      }
    },
    required: [
      'contextIdentifier',
      'aggregateIdentifier',
      'name',
      'data'
    ],
    additionalProperties: false
  };
};

const getCommandSchema = function (): Value {
  return new Value(getSchema());
};

export { getCommandSchema, getSchema };
