import { Schema } from '../elements/Schema';
import { Value } from 'validate-value';

const getSchema = function (): Schema {
  return {
    type: 'object',
    patternProperties: {
      '*': {
        type: 'object',
        patternProperties: {
          '*': {
            type: 'object',
            patternProperties: {
              '*': {
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

const getDomainEventsDescriptionSchema = function (): Value {
  return new Value(getSchema());
};

export { getDomainEventsDescriptionSchema, getSchema };
