import { jsonSchema } from 'uuidv4';
import { Schema } from '../elements/Schema';

const getSnapshotSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      aggregateIdentifier: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' },
          id: jsonSchema.v4 as Schema
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
