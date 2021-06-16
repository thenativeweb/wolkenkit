"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsumerProgressStoreOptionsSchema = void 0;
const getPortSchema_1 = require("./getPortSchema");
const portSchema = getPortSchema_1.getPortSchema();
const getConsumerProgressStoreOptionsSchema = function () {
    return {
        type: 'object',
        oneOf: [
            {
                properties: {
                    type: { type: 'string', enum: ['InMemory'] }
                },
                required: ['type'],
                additionalProperties: false
            },
            {
                properties: {
                    type: { type: 'string', enum: ['MongoDb'] },
                    connectionString: { type: 'string', minLength: 1 },
                    collectionNames: {
                        type: 'object',
                        properties: {
                            progress: { type: 'string', minLength: 1 }
                        },
                        required: ['progress'],
                        additionalProperties: false
                    }
                },
                required: ['type', 'connectionString', 'collectionNames'],
                additionalProperties: false
            },
            {
                properties: {
                    type: { type: 'string', enum: ['MariaDb', 'MySql'] },
                    hostName: { type: 'string', format: 'hostname' },
                    port: portSchema,
                    userName: { type: 'string', minLength: 1 },
                    password: { type: 'string', minLength: 1 },
                    database: { type: 'string', minLength: 1 },
                    tableNames: {
                        type: 'object',
                        properties: {
                            progress: { type: 'string', minLength: 1 }
                        },
                        required: ['progress'],
                        additionalProperties: false
                    }
                },
                required: ['type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames'],
                additionalProperties: false
            },
            {
                properties: {
                    type: { type: 'string', enum: ['Postgres'] },
                    hostName: { type: 'string', format: 'hostname' },
                    port: portSchema,
                    userName: { type: 'string', minLength: 1 },
                    password: { type: 'string', minLength: 1 },
                    database: { type: 'string', minLength: 1 },
                    encryptConnection: { type: 'boolean' },
                    tableNames: {
                        type: 'object',
                        properties: {
                            progress: { type: 'string', minLength: 1 }
                        },
                        required: ['progress'],
                        additionalProperties: false
                    }
                },
                required: ['type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames'],
                additionalProperties: false
            },
            {
                properties: {
                    type: { type: 'string', enum: ['SqlServer'] },
                    hostName: { type: 'string', format: 'hostname' },
                    port: portSchema,
                    userName: { type: 'string', minLength: 1 },
                    password: { type: 'string', minLength: 1 },
                    database: { type: 'string', minLength: 1 },
                    encryptConnection: { type: 'boolean' },
                    tableNames: {
                        type: 'object',
                        properties: {
                            progress: { type: 'string', minLength: 1 }
                        },
                        required: ['progress'],
                        additionalProperties: false
                    }
                },
                required: ['type', 'hostName', 'port', 'userName', 'password', 'database', 'tableNames'],
                additionalProperties: false
            }
        ]
    };
};
exports.getConsumerProgressStoreOptionsSchema = getConsumerProgressStoreOptionsSchema;
//# sourceMappingURL=getConsumerProgressStoreOptionsSchema.js.map