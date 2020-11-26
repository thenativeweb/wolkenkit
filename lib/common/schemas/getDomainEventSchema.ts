import { Schema } from '../elements/Schema';

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
          id: { type: 'string', format: 'uuid' }
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
      id: { type: 'string', format: 'uuid' },
      metadata: {
        type: 'object',
        properties: {
          causationId: { type: 'string', format: 'uuid' },
          correlationId: { type: 'string', format: 'uuid' },
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
