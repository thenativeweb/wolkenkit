"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.all = void 0;
const stream_1 = require("stream");
exports.all = {
    type: 'stream',
    getResultItemSchema() {
        return {
            type: 'object',
            properties: {
                id: { type: 'string' },
                createdAt: { type: 'number' },
                updatedAt: { type: 'number' },
                strategy: { type: 'string', enum: ['succeed', 'fail', 'reject'] }
            },
            required: ['id', 'createdAt', 'strategy'],
            additionalProperties: false
        };
    },
    async handle(_options, { infrastructure }) {
        return stream_1.Readable.from(infrastructure.ask.viewStore.domainEvents);
    },
    isAuthorized() {
        return true;
    }
};
//# sourceMappingURL=all.js.map