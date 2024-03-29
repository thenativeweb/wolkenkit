import { getPortSchema } from './getPortSchema';
import { getPostgresConnectionOptionsSchema } from '../../../stores/utils/postgres/getPostgresConnectionOptionsSchema';
import { Schema } from '../../../common/elements/Schema';

const portSchema = getPortSchema();
const connectionOptionsSchema = getPostgresConnectionOptionsSchema();

const getPriorityQueueStoreOptionsSchema = function (): Schema {
  return {
    type: 'object',
    oneOf: [
      {
        properties: {
          type: { type: 'string', enum: [ 'InMemory' ]},
          expirationTime: { type: 'number', minimum: 1 }
        },
        required: [ 'type', 'expirationTime' ],
        additionalProperties: false
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'MongoDb' ]},
          expirationTime: { type: 'number', minimum: 1 },
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
        required: [ 'type', 'connectionString', 'collectionNames' ],
        additionalProperties: false
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'MariaDb', 'MySql' ]},
          expirationTime: { type: 'number', minimum: 1 },
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          userName: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          tableNames: {
            type: 'object',
            properties: {
              items: { type: 'string', minLength: 1 },
              priorityQueue: { type: 'string', minLength: 1 }
            },
            required: [ 'items', 'priorityQueue' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames' ],
        additionalProperties: false
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'Postgres' ]},
          expirationTime: { type: 'number', minimum: 1 },
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          userName: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          encryptConnection: connectionOptionsSchema,
          tableNames: {
            type: 'object',
            properties: {
              items: { type: 'string', minLength: 1 },
              priorityQueue: { type: 'string', minLength: 1 }
            },
            required: [ 'items', 'priorityQueue' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames' ],
        additionalProperties: false
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'SqlServer' ]},
          expirationTime: { type: 'number', minimum: 1 },
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          userName: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          encryptConnection: { type: 'boolean' },
          tableNames: {
            type: 'object',
            properties: {
              items: { type: 'string', minLength: 1 },
              priorityQueue: { type: 'string', minLength: 1 }
            },
            required: [ 'items', 'priorityQueue' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames' ],
        additionalProperties: false
      }
    ]
  };
};

export { getPriorityQueueStoreOptionsSchema };
