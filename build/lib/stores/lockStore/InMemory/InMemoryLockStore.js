"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryLockStore = void 0;
const getHash_1 = require("../../../common/utils/crypto/getHash");
const errors = __importStar(require("../../../common/errors"));
class InMemoryLockStore {
    constructor() {
        this.database = {
            locks: []
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async create(options) {
        return new InMemoryLockStore();
    }
    async removeExpiredLocks() {
        this.database.locks = this.database.locks.filter((lock) => lock.expiresAt >= Date.now());
    }
    async acquireLock({ value, expiresAt = Number.MAX_SAFE_INTEGER }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        // From time to time, we should removed expired locks. Doing this before
        // acquiring new ones is a good point in time for this.
        await this.removeExpiredLocks();
        const hash = getHash_1.getHash({ value });
        const isLocked = this.database.locks.some((lock) => lock.value === hash);
        if (isLocked) {
            throw new errors.LockAcquireFailed('Failed to acquire lock.');
        }
        const lock = { value: hash, expiresAt };
        this.database.locks.push(lock);
    }
    async isLocked({ value }) {
        const hash = getHash_1.getHash({ value });
        return this.database.locks.some((lock) => lock.value === hash && Date.now() <= lock.expiresAt);
    }
    async renewLock({ value, expiresAt }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        // From time to time, we should removed expired locks. Doing this before
        // renewing existing ones is a good point in time for this.
        await this.removeExpiredLocks();
        const hash = getHash_1.getHash({ value });
        const existingLock = this.database.locks.find((lock) => lock.value === hash);
        if (!existingLock) {
            throw new errors.LockRenewalFailed('Failed to renew lock.');
        }
        existingLock.expiresAt = expiresAt;
    }
    async releaseLock({ value }) {
        // From time to time, we should removed expired locks. Doing this before
        // releasing existing ones is a good point in time for this.
        await this.removeExpiredLocks();
        const hash = getHash_1.getHash({ value });
        const index = this.database.locks.findIndex((lock) => lock.value === hash);
        if (index === -1) {
            return;
        }
        this.database.locks.splice(index, 1);
    }
    // eslint-disable-next-line class-methods-use-this
    async setup() {
        // There is nothing to do here.
    }
    async destroy() {
        this.database = {
            locks: []
        };
    }
}
exports.InMemoryLockStore = InMemoryLockStore;
//# sourceMappingURL=InMemoryLockStore.js.map