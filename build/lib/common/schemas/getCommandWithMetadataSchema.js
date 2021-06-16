"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandWithMetadataSchema = void 0;
const getAggregateIdentifierSchema_1 = require("./getAggregateIdentifierSchema");
const getClientSchema_1 = require("./getClientSchema");
const getCommandWithMetadataSchema = function () {
    return {
        type: 'object',
        properties: {
            aggregateIdentifier: getAggregateIdentifierSchema_1.getAggregateIdentifierSchema(),
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
                    timestamp: { type: 'number' },
                    client: getClientSchema_1.getClientSchema(),
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
                                        required: ['sub'],
                                        additionalProperties: true
                                    }
                                },
                                required: ['id', 'claims'],
                                additionalProperties: false
                            }
                        },
                        required: ['user'],
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
            'aggregateIdentifier',
            'name',
            'data',
            'id',
            'metadata'
        ],
        additionalProperties: false
    };
};
exports.getCommandWithMetadataSchema = getCommandWithMetadataSchema;
//# sourceMappingURL=getCommandWithMetadataSchema.js.map