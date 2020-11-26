import { Schema } from '../elements/Schema';

const getSnapshotSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      aggregateIdentifier: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' },
          id: { type: 'string', format: 'uuid' }
        },
        required: [ 'name', 'id' ],
        additionalProperties: false
      },
      revision: { type: 'number', minimum: 0 },
      state: { type: 'object' }
    },
    required: [
      'aggregateIdentifier',
      'revision',
      'state'
    ],
    additionalProperties: false
  };
};

export { getSnapshotSchema };
