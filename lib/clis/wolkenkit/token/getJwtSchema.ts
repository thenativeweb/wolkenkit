import { GraphqlIncompatibleSchema } from '../../../common/elements/Schema';

const getJwtSchema = function (): GraphqlIncompatibleSchema {
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
