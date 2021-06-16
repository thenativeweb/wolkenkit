"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItemIdentifierWithClientSchema = void 0;
const getAggregateIdentifierSchema_1 = require("./getAggregateIdentifierSchema");
const getClientSchema_1 = require("./getClientSchema");
const getItemIdentifierWithClientSchema = function () {
    return {
        type: 'object',
        properties: {
            aggregateIdentifier: getAggregateIdentifierSchema_1.getAggregateIdentifierSchema(),
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 1, format: 'alphanumeric' },
            client: getClientSchema_1.getClientSchema()
        },
        required: [
            'aggregateIdentifier',
            'id',
            'name',
            'client'
        ],
        additionalProperties: false
    };
};
exports.getItemIdentifierWithClientSchema = getItemIdentifierWithClientSchema;
//# sourceMappingURL=getItemIdentifierWithClientSchema.js.map