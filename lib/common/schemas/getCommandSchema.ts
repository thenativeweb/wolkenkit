import { regex } from 'uuidv4';
import { Value } from 'validate-value';

const uuidRegex = regex.v4.toString().slice(1, -1);

const getCommandSchema = function (): Value {
  return new Value({
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
  });
};

export { getCommandSchema };
