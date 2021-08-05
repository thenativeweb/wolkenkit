import { Schema } from '../../../common/elements/Schema';

const getPostgresConnectionOptionsSchema = function (): Schema {
  return {
    oneOf: [
      {
        type: 'object',
        properties: {
          rejectUnauthorized: { type: 'boolean' },
          ca: { type: 'string' },
          privateKey: { type: 'string' },
          certificate: { type: 'string' }
        },
        required: [],
        additionalProperties: false
      },
      { type: 'boolean' }
    ]
  };
};

export {
  getPostgresConnectionOptionsSchema
};
