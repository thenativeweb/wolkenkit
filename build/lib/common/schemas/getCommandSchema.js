"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandSchema = void 0;
const getAggregateIdentifierSchema_1 = require("./getAggregateIdentifierSchema");
const getCommandSchema = function () {
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
            }
        },
        required: [
            'aggregateIdentifier',
            'name',
            'data'
        ],
        additionalProperties: false
    };
};
exports.getCommandSchema = getCommandSchema;
//# sourceMappingURL=getCommandSchema.js.map