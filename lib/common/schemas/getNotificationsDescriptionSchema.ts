import { GraphqlIncompatibleSchema } from '../elements/Schema';

const getNotificationsDescriptionSchema = function (): GraphqlIncompatibleSchema {
  return {
    type: 'object',
    patternProperties: {
      '.*': {
        type: 'object',
        properties: {
          documentation: { type: 'string' },
          dataSchema: { type: 'object' },
          metadataSchema: { type: 'object' }
        },
        additionalProperties: false
      }
    }
  };
};

export { getNotificationsDescriptionSchema };
