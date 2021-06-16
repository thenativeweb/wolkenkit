"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItemIdentifierSchema = void 0;
const getAggregateIdentifierSchema_1 = require("./getAggregateIdentifierSchema");
const getItemIdentifierSchema = function () {
    return {
        type: 'object',
        properties: {
            aggregateIdentifier: getAggregateIdentifierSchema_1.getAggregateIdentifierSchema(),
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 1, format: 'alphanumeric' }
        },
        required: [
            'aggregateIdentifier',
            'id',
            'name'
        ],
        additionalProperties: false
    };
};
exports.getItemIdentifierSchema = getItemIdentifierSchema;
//# sourceMappingURL=getItemIdentifierSchema.js.map