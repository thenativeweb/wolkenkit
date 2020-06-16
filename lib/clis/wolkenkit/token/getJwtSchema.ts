import { Schema } from '../../../common/elements/Schema';

const getJwtSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      sub: { type: 'string', minLength: 1 }
    },
    required: [ 'sub' ],
    additionalProperties: true
  };
};

export { getJwtSchema };
