"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileStoreOptionsSchema = void 0;
const getPortSchema_1 = require("./getPortSchema");
const portSchema = getPortSchema_1.getPortSchema();
const getFileStoreOptionsSchema = function () {
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
                    type: { type: 'string', enum: ['FileSystem'] },
                    directory: { type: 'string', minLength: 1 }
                },
                required: ['type'],
                additionalProperties: false
            },
            {
                properties: {
                    type: { type: 'string', enum: ['S3'] },
                    hostName: { type: 'string', minLength: 1, format: 'hostname' },
                    port: portSchema,
                    encryptConnection: { type: 'boolean' },
                    accessKey: { type: 'string', minLength: 1 },
                    secretKey: { type: 'string', minLength: 1 },
                    region: { type: 'string', minLength: 1 },
                    bucketName: { type: 'string', minLength: 1 }
                },
                required: ['type', 'accessKey', 'secretKey', 'bucketName'],
                additionalProperties: false
            }
        ]
    };
};
exports.getFileStoreOptionsSchema = getFileStoreOptionsSchema;
//# sourceMappingURL=getFileStoreOptionsSchema.js.map