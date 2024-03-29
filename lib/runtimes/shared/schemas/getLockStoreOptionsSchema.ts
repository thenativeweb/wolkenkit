import { getPortSchema } from './getPortSchema';
import { getPostgresConnectionOptionsSchema } from '../../../stores/utils/postgres/getPostgresConnectionOptionsSchema';
import { Schema } from '../../../common/elements/Schema';

const portSchema = getPortSchema();
const connectionOptionsSchema = getPostgresConnectionOptionsSchema();

const getLockStoreOptionsSchema = function (): Schema {
  return {
    type: 'object',
    oneOf: [
      {
        properties: {
          type: { type: 'string', enum: [ 'InMemory' ]}
        },
        required: [ 'type' ],
        additionalProperties: false
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'MongoDb' ]},
          connectionString: { type: 'string', minLength: 1 },
          collectionNames: {
            type: 'object',
            properties: {
              locks: { type: 'string', minLength: 1 }
            },
            required: [ 'locks' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'connectionString', 'collectionNames' ],
        additionalProperties: false
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
              locks: { type: 'string', minLength: 1 }
            },
            required: [ 'locks' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames' ],
        additionalProperties: false
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'Postgres' ]},
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          userName: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          encryptConnection: connectionOptionsSchema,
          tableNames: {
            type: 'object',
            properties: {
              locks: { type: 'string', minLength: 1 }
            },
            required: [ 'locks' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames' ],
        additionalProperties: false
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'Redis' ]},
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          listNames: {
            type: 'object',
            properties: {
              locks: { type: 'string', minLength: 1 }
            },
            required: [ 'locks' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'password', 'database', 'listNames' ],
        additionalProperties: false
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
              locks: { type: 'string', minLength: 1 }
            },
            required: [ 'locks' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames' ],
        additionalProperties: false
      }
    ]
  };
};

export { getLockStoreOptionsSchema };
