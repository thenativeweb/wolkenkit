import { GraphqlIncompatibleSchema } from '../../../common/elements/Schema';

const getIdentityProviderSchema = function (): GraphqlIncompatibleSchema {
  return {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        issuer: { type: 'string' },
        certificate: { type: 'string' }
      },
      required: [ 'issuer', 'certificate' ],
      additionalProperties: false
    }
  };
};

export {
  getIdentityProviderSchema
};
