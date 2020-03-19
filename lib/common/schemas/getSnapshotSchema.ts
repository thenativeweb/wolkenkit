import { regex } from 'uuidv4';
import { Value } from 'validate-value';

// eslint-disable-next-line @typescript-eslint/no-base-to-string
const uuidRegex = regex.v4.toString().slice(1, -1);

const getSnapshotSchema = function (): Value {
  return new Value({
    type: 'object',
    properties: {
      aggregateIdentifier: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' },
          id: { type: 'string', pattern: uuidRegex }
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
  });
};

export { getSnapshotSchema };
