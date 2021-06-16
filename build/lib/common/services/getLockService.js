"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLockService = void 0;
const getLockService = function ({ lockStore }) {
    return {
        async acquireLock({ value, expiresAt }) {
            return await lockStore.acquireLock({ value, expiresAt });
        },
        async isLocked({ value }) {
            return await lockStore.isLocked({ value });
        },
        async renewLock({ value, expiresAt }) {
            return await lockStore.renewLock({ value, expiresAt });
        },
        async releaseLock({ value }) {
            return await lockStore.releaseLock({ value });
        }
    };
};
exports.getLockService = getLockService;
//# sourceMappingURL=getLockService.js.map