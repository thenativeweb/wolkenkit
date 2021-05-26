import { getAggregateIdentifierSchema } from './getAggregateIdentifierSchema';
import { GraphqlIncompatibleSchema } from '../elements/Schema';

const getSnapshotSchema = function (): GraphqlIncompatibleSchema {
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
