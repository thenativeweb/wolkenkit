import { Schema } from '../elements/Schema';

const getContextIdentifierSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, format: 'alphanumeric' }
    },
    required: [ 'name' ],
    additionalProperties: false
  };
};

export { getContextIdentifierSchema };
