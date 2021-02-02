import { getAggregateIdentifierSchema } from './getAggregateIdentifierSchema';
import { Schema } from '../elements/Schema';

const getItemIdentifierSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      aggregateIdentifier: getAggregateIdentifierSchema(),
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, format: 'alphanumeric' }
    },
    required: [
      'aggregateIdentifier',
      'id',
      'name'
    ],
    additionalProperties: false
  };
};

export { getItemIdentifierSchema };
