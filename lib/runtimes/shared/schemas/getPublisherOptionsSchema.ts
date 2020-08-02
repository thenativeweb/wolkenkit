import { Schema } from '../../../common/elements/Schema';

const getPublisherOptionsSchema = function (): Schema {
  return {
    type: 'object',
    oneOf: [
      {
        properties: {
          type: { type: 'string', enum: [ 'InMemory' ]}
        },
        required: [ 'type' ],
        additionalProperties: false
      }
    ]
  };
};

export { getPublisherOptionsSchema };
