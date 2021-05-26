import { GraphqlIncompatibleSchema } from '../elements/Schema';

const getCommandsDescriptionSchema = function (): GraphqlIncompatibleSchema {
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

export { getCommandsDescriptionSchema };
