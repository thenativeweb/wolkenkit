import { regex } from 'uuidv4';
import { Schema } from '../../../../common/elements/Schema';

const uuidRegex = regex.v4.toString().slice(1, -1);

// This is a modified copy of the core schema in lib/common/schemas/getCommandSchema.
// This version replaces the data object with a string.
// This needs to be kept relatively in sync with the above mentioned schema.
const getCommandSchema = function (): Schema {
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
        type: 'string',
        description: `The command's payload as a json string.`
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

export { getCommandSchema };
