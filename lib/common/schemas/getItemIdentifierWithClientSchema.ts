import { getAggregateIdentifierSchema } from './getAggregateIdentifierSchema';
import { getClientSchema } from './getClientSchema';
import { Schema } from '../elements/Schema';

const getItemIdentifierWithClientSchema = function (): Schema {
  return {
    type: 'object',
    properties: {
      aggregateIdentifier: getAggregateIdentifierSchema(),
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, format: 'alphanumeric' },
      client: getClientSchema()
    },
    required: [
      'aggregateIdentifier',
      'id',
      'name',
      'client'
    ],
    additionalProperties: false
  };
};

export { getItemIdentifierWithClientSchema };
