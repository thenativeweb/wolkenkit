import { regex } from 'uuidv4';
import { Value } from 'validate-value';

// eslint-disable-next-line @typescript-eslint/no-base-to-string
const uuidRegex = regex.v4.toString().slice(1, -1);

const getDomainEventWithStateSchema = function (): Value {
  return new Value({
    type: 'object',
    properties: {
      contextIdentifier: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' }
        },
        required: [ 'name' ],
        additionalProperties: false
      },
      aggregateIdentifier: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, format: 'alphanumeric' },
          id: { type: 'string', pattern: uuidRegex }
        },
        required: [ 'name', 'id' ],
        additionalProperties: false
      },
      name: { type: 'string', minLength: 1, format: 'alphanumeric' },
      data: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: true
      },
      id: { type: 'string', pattern: uuidRegex },
      metadata: {
        type: 'object',
        properties: {
          causationId: { type: 'string', pattern: uuidRegex },
          correlationId: { type: 'string', pattern: uuidRegex },
          timestamp: { type: 'number', minimum: 0 },
          revision: { type: 'number', minimum: 1 },
          initiator: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', minLength: 1 },
                  claims: {
                    type: 'object',
                    properties: {
                      sub: { type: 'string', minLength: 1 }
                    },
                    required: [ 'sub' ],
                    additionalProperties: true
                  }
                },
                required: [ 'id', 'claims' ],
                additionalProperties: false
              }
            },
            required: [ 'user' ],
            additionalProperties: false
          },
          tags: {
            type: 'array',
            items: { type: 'string', minLength: 1 }
          }
        },
        required: [
          'causationId',
          'correlationId',
          'timestamp',
          'revision',
          'initiator',
          'tags'
        ],
        additionalProperties: false
      },
      state: {
        type: 'object',
        properties: {
          previous: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: true
          },
          next: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: true
          }
        },
        required: [ 'previous', 'next' ],
        additionalProperties: false
      }
    },
    required: [
      'contextIdentifier',
      'aggregateIdentifier',
      'name',
      'data',
      'id',
      'metadata',
      'state'
    ],
    additionalProperties: false
  });
};

export { getDomainEventWithStateSchema };
