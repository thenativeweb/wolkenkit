import { regex } from 'uuidv4';
import { Value } from 'validate-value';

// eslint-disable-next-line @typescript-eslint/no-base-to-string
const uuidRegex = regex.v4.toString().slice(1, -1);

const getAggregateIdentifierSchema = function (): Value {
  return new Value({
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, format: 'alphanumeric' },
      id: { type: 'string', pattern: uuidRegex }
    },
    required: [ 'name', 'id' ],
    additionalProperties: false
  });
};

export { getAggregateIdentifierSchema };
