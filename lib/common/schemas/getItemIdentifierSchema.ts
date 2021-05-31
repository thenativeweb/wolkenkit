import { ApiSchema } from '../elements/Schema';
import { getAggregateIdentifierSchema } from './getAggregateIdentifierSchema';

const getItemIdentifierSchema = function (): ApiSchema {
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
