"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = void 0;
exports.execute = {
    getSchema() {
        return {
            type: 'object',
            properties: {
                strategy: { type: 'string', enum: ['succeed', 'fail', 'reject'] }
            },
            required: ['strategy'],
            additionalProperties: false
        };
    },
    isAuthorized() {
        return true;
    },
    handle(_state, command, { aggregate, error }) {
        const { strategy } = command.data;
        if (strategy === 'fail') {
            throw new Error('Intentionally failed execute.');
        }
        if (strategy === 'reject') {
            throw new error.CommandRejected('Intentionally rejected execute.');
        }
        aggregate.publishDomainEvent('succeeded', {});
        aggregate.publishDomainEvent('executed', { strategy });
    }
};
//# sourceMappingURL=execute.js.map