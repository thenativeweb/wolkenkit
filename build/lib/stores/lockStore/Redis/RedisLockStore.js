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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisLockStore = void 0;
const getHash_1 = require("../../../common/utils/crypto/getHash");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const ioredis_1 = __importDefault(require("ioredis"));
const errors = __importStar(require("../../../common/errors"));
class RedisLockStore {
    constructor({ client, listNames }) {
        this.client = client;
        this.listNames = listNames;
    }
    getKey({ value }) {
        const hash = getHash_1.getHash({ value });
        const key = `${this.listNames.locks}_${hash}`;
        return key;
    }
    static getExpiration({ expiresAt }) {
        return expiresAt - Date.now();
    }
    static onUnexpectedError() {
        throw new Error('Connection closed unexpectedly.');
    }
    static async create({ hostName, port, password, database, listNames }) {
        const client = await retry_ignore_abort_1.retry(async () => {
            const redis = new ioredis_1.default({
                host: hostName,
                port,
                password,
                db: database
            });
            return redis;
        });
        client.on('error', RedisLockStore.onUnexpectedError);
        return new RedisLockStore({ client, listNames });
    }
    async acquireLock({ value, expiresAt = Number.MAX_SAFE_INTEGER }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        const key = this.getKey({ value });
        const expiration = RedisLockStore.getExpiration({ expiresAt });
        const result = await this.client.set(key, '', 'PX', expiration, 'NX');
        if (!result) {
            throw new errors.LockAcquireFailed('Failed to acquire lock.');
        }
    }
    async isLocked({ value }) {
        const key = this.getKey({ value });
        const count = await this.client.exists(key);
        return count === 1;
    }
    async renewLock({ value, expiresAt }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        const key = this.getKey({ value });
        const expiration = RedisLockStore.getExpiration({ expiresAt });
        const result = await this.client.pexpire(key, expiration);
        if (!result) {
            throw new errors.LockRenewalFailed('Failed to renew lock.');
        }
    }
    async releaseLock({ value }) {
        const key = this.getKey({ value });
        await this.client.del(key);
    }
    // eslint-disable-next-line class-methods-use-this
    async setup() {
        // There is nothing to do here.
    }
    async destroy() {
        this.client.removeListener('error', RedisLockStore.onUnexpectedError);
        await new Promise((resolve, reject) => {
            this.client.quit((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}
exports.RedisLockStore = RedisLockStore;
//# sourceMappingURL=RedisLockStore.js.map