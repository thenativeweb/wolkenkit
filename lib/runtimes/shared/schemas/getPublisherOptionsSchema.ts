import { Schema } from '../../../common/elements/Schema';

const getPublisherOptionsSchema = function (): Schema {
  return {
    type: 'object',
    oneOf: [
      {
        properties: {
          type: { type: 'string', enum: [ 'InMemory' ]},
          expirationTime: { type: 'number', minimum: 1 }
        },
        required: [ 'type', 'expirationTime' ]
      }
    ],
    additionalProperties: false
  };
};

export { getPublisherOptionsSchema };
