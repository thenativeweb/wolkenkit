"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAggregateIdentifierSchema = void 0;
const getAggregateIdentifierSchema = function () {
    return {
        type: 'object',
        properties: {
            context: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, format: 'alphanumeric' }
                },
                required: ['name'],
                additionalProperties: false
            },
            aggregate: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, format: 'alphanumeric' },
                    id: { type: 'string', format: 'uuid' }
                },
                required: ['name', 'id'],
                additionalProperties: false
            }
        },
        required: ['context', 'aggregate'],
        additionalProperties: false
    };
};
exports.getAggregateIdentifierSchema = getAggregateIdentifierSchema;
//# sourceMappingURL=getAggregateIdentifierSchema.js.map