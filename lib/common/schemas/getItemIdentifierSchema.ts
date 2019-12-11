import { regex } from 'uuidv4';
import { Value } from 'validate-value';

const uuidRegex = regex.v4.toString().slice(1, -1);

const getItemIdentifierSchema = function (): Value {
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
      id: { type: 'string', pattern: uuidRegex },
      name: { type: 'string', minLength: 1, format: 'alphanumeric' }
    },
    required: [
      'contextIdentifier',
      'aggregateIdentifier',
      'id',
      'name'
    ],
    additionalProperties: false
  });
};

export { getItemIdentifierSchema };
