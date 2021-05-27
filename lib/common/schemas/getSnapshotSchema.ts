import { getAggregateIdentifierSchema } from './getAggregateIdentifierSchema';
import { Schema } from '../elements/Schema';

const getSnapshotSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      aggregateIdentifier: getAggregateIdentifierSchema(),
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
