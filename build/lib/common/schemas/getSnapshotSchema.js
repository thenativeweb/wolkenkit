"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSnapshotSchema = void 0;
const getAggregateIdentifierSchema_1 = require("./getAggregateIdentifierSchema");
const getSnapshotSchema = function () {
    return {
        type: 'object',
        properties: {
            aggregateIdentifier: getAggregateIdentifierSchema_1.getAggregateIdentifierSchema(),
            revision: { type: 'number', minimum: 0 },
            state: { type: 'object' }
        },
        required: [
            'aggregateIdentifier',
            'revision',
            'state'
        ],
        additionalProperties: false
    };
};
exports.getSnapshotSchema = getSnapshotSchema;
//# sourceMappingURL=getSnapshotSchema.js.map