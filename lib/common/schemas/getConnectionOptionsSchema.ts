import { Schema } from '../elements/Schema';

const getConnectionOptionsSchema = function (): Schema {
  return {
    oneOf: [
      {
        type: 'object',
        properties: {
          rejectUnauthorized: { type: 'boolean' },
          ca: { type: 'string' },
          key: { type: 'string' },
          cert: { type: 'string' }
        },
        additionalProperties: false
      },
      { type: 'boolean' }
    ]
  };
};

export {
  getConnectionOptionsSchema
};
