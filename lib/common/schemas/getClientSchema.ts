import { Schema } from '../elements/Schema';

const getClientSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      token: { type: 'string', minLength: 1 },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
          claims: {
            type: 'object',
            properties: {
              sub: { type: 'string', minLength: 1 }
            },
            required: [ 'sub' ],
            additionalProperties: true
          }
        },
        required: [ 'id', 'claims' ],
        additionalProperties: false
      },
      ip: { type: 'string', minLength: 1 }
    },
    required: [ 'token', 'user', 'ip' ],
    additionalProperties: false
  };
};

export { getClientSchema };
