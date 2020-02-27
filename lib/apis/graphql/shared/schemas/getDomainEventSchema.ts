import { regex } from 'uuidv4';
import { Schema } from '../../../../common/elements/Schema';

const uuidRegex = regex.v4.toString().slice(1, -1);

// This is a modified copy of the core schema in lib/common/schemas/getDomainEventSchema.
// This version does not contain the initiator's claims and replaces the data
// object with a string.
// This needs to be kept relatively in sync with the above mentioned schema.
const getDomainEventSchema = function (): Schema {
  return {
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
      id: { type: 'string', pattern: uuidRegex },
      data: {
        type: 'string',
        description: `The event's payload as a json string.`
      },
      metadata: {
        type: 'object',
        properties: {
          causationId: { type: 'string', pattern: uuidRegex },
          correlationId: { type: 'string', pattern: uuidRegex },
          timestamp: { type: 'number' },
          revision: {
            type: 'object',
            properties: {
              aggregate: { type: 'number', minimum: 1 },
              global: {
                anyOf: [{ type: 'number', minimum: 1 }, { type: 'null' }]
              }
            },
            required: [ 'aggregate' ],
            additionalProperties: false
          },
          initiator: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', minLength: 1 }
                },
                required: [ 'id' ],
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
      }
    },
    required: [
      'contextIdentifier',
      'aggregateIdentifier',
      'name',
      'data',
      'id',
      'metadata'
    ],
    additionalProperties: false
  };
};

export { getDomainEventSchema };
