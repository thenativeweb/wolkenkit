"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executed = void 0;
exports.executed = {
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
    handle(state) {
        return {
            domainEventNames: [...state.domainEventNames, 'executed']
        };
    },
    isAuthorized() {
        return true;
    }
};
//# sourceMappingURL=executed.js.map