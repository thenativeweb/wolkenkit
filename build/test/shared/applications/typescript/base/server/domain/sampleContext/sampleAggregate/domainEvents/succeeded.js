"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.succeeded = void 0;
/* eslint-enable @typescript-eslint/no-empty-interface */
exports.succeeded = {
    getSchema() {
        return {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false
        };
    },
    handle(state) {
        return {
            domainEventNames: [...state.domainEventNames, 'succeeded']
        };
    },
    isAuthorized() {
        return true;
    }
};
//# sourceMappingURL=succeeded.js.map