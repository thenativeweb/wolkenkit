"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomainEventWithStateSchema = void 0;
const getAggregateIdentifierSchema_1 = require("./getAggregateIdentifierSchema");
const getDomainEventWithStateSchema = function () {
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
            },
            state: {
                type: 'object',
                properties: {
                    previous: {
                        type: 'object',
                        properties: {},
                        required: [],
                        additionalProperties: true
                    },
                    next: {
                        type: 'object',
                        properties: {},
                        required: [],
                        additionalProperties: true
                    }
                },
                required: ['previous', 'next'],
                additionalProperties: false
            }
        },
        required: [
            'aggregateIdentifier',
            'name',
            'data',
            'id',
            'metadata',
            'state'
        ],
        additionalProperties: false
    };
};
exports.getDomainEventWithStateSchema = getDomainEventWithStateSchema;
//# sourceMappingURL=getDomainEventWithStateSchema.js.map