import { getClientSchema } from './getClientSchema';
import { jsonSchema } from '../utils/uuid';
import { Schema } from '../elements/Schema';

const getCommandWithMetadataSchema = function (): Schema {
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
          id: jsonSchema
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
      id: jsonSchema,
      metadata: {
        type: 'object',
        properties: {
          causationId: jsonSchema,
          correlationId: jsonSchema,
          timestamp: { type: 'number' },
          client: getClientSchema(),
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
          }
        },
        required: [
          'causationId',
          'correlationId',
          'timestamp',
          'client',
          'initiator'
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

export { getCommandWithMetadataSchema };
