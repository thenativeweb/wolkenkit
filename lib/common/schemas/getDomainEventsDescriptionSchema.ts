import { Schema } from '../elements/Schema';

const getDomainEventsDescriptionSchema = function (): Schema {
  return {
    type: 'object',
    patternProperties: {
      '.*': {
        type: 'object',
        patternProperties: {
          '.*': {
            type: 'object',
            patternProperties: {
              '.*': {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  schema: { type: 'object' }
                },
                additionalProperties: false
              }
            }
          }
        }
      }
    }
  };
};

export { getDomainEventsDescriptionSchema };
