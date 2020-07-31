import { getPortSchema } from './getPortSchema';
import { Schema } from '../../../common/elements/Schema';

const portSchema = getPortSchema();

const getDomainEventStoreOptionsSchema = function (): Schema {
  return {
    type: 'object',
    oneOf: [
      {
        properties: {
          type: { type: 'string', enum: [ 'InMemory' ]}
        },
        required: [ 'type' ]
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'MongoDb' ]},
          connectionString: { type: 'string', minLength: 1 },
          collectionNames: {
            type: 'object',
            properties: {
              queues: { type: 'string', minLength: 1 }
            },
            required: [ 'queues' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'connectionString', 'collectionNames' ]
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'MariaDb', 'MySql' ]},
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          userName: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          tableNames: {
            type: 'object',
            properties: {
              domainEvents: { type: 'string', minLength: 1 },
              snapshot: { type: 'string', minLength: 1 }
            },
            required: [ 'domainEvents', 'snapshot' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames' ]
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'Postgres' ]},
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          userName: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          encryptConnection: { type: 'boolean' },
          tableNames: {
            type: 'object',
            properties: {
              domainEvents: { type: 'string', minLength: 1 },
              snapshot: { type: 'string', minLength: 1 }
            },
            required: [ 'domainEvents', 'snapshot' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'encryptConnection', 'tableNames' ]
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'SqlServer' ]},
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          userName: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          encryptConnection: { type: 'boolean' },
          tableNames: {
            type: 'object',
            properties: {
              domainEvents: { type: 'string', minLength: 1 },
              snapshot: { type: 'string', minLength: 1 }
            },
            required: [ 'domainEvents', 'snapshot' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'encryptConnection', 'tableNames' ]
      }
    ],
    additionalProperties: false
  };
};

export { getDomainEventStoreOptionsSchema };
