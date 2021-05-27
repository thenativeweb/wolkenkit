import { Schema } from '../../../common/elements/Schema';

const getIdentityProviderSchema = function (): Schema {
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
