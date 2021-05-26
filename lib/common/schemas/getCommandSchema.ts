import { getAggregateIdentifierSchema } from './getAggregateIdentifierSchema';
import { GraphqlIncompatibleSchema } from '../elements/Schema';

const getCommandSchema = function (): GraphqlIncompatibleSchema {
  return {
    type: 'object',
    properties: {
      aggregateIdentifier: getAggregateIdentifierSchema(),
      name: { type: 'string', minLength: 1, format: 'alphanumeric' },
      data: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: true
      }
    },
    required: [
      'aggregateIdentifier',
      'name',
      'data'
    ],
    additionalProperties: false
  };
};

export { getCommandSchema };
