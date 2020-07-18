import { Schema } from '../elements/Schema';

const getViewsDescriptionSchema = function (): Schema {
  return {
    type: 'object',
    patternProperties: {
      '.*': {
        type: 'object',
        patternProperties: {
          '.*': {
            type: 'object',
            properties: {
              documentation: { type: 'string' },
              optionsSchema: { type: 'object' },
              itemSchema: { type: 'object' }
            },
            additionalProperties: false
          }
        }
      }
    }
  };
};

export { getViewsDescriptionSchema };
