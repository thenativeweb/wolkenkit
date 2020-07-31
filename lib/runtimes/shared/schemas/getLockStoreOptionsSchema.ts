import { getPortSchema } from './getPortSchema';
import { Schema } from '../../../common/elements/Schema';

const portSchema = getPortSchema();

const getLockStoreOptionsSchema = function (): Schema {
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
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          userName: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          database: { type: 'string', minLength: 1 },
          collectionNames: {
            type: 'object',
            properties: {
              locks: { type: 'string', minLength: 1 }
            },
            required: [ 'locks' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'collectionNames' ]
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
              locks: { type: 'string', minLength: 1 }
            },
            required: [ 'locks' ],
            additionalProperties: false
          }
        },
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'encryptConnection', 'tableNames' ]
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
        required: [ 'type', 'hostName', 'port', 'password', 'database', 'listNames' ]
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
        required: [ 'type', 'hostName', 'port', 'userName', 'password', 'database', 'encryptConnection', 'tableNames' ]
      }
    ],
    additionalProperties: false
  };
};

export { getLockStoreOptionsSchema };
