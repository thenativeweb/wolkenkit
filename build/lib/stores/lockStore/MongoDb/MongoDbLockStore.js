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
exports.MongoDbLockStore = void 0;
const getHash_1 = require("../../../common/utils/crypto/getHash");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const url_1 = require("url");
const mongodb_1 = require("mongodb");
const errors = __importStar(require("../../../common/errors"));
class MongoDbLockStore {
    constructor({ client, db, collectionNames, collections }) {
        this.client = client;
        this.db = db;
        this.collectionNames = collectionNames;
        this.collections = collections;
    }
    static onUnexpectedClose() {
        throw new Error('Connection closed unexpectedly.');
    }
    static async create({ connectionString, collectionNames }) {
        const client = await retry_ignore_abort_1.retry(async () => {
            const connection = await mongodb_1.MongoClient.connect(connectionString, 
            // eslint-disable-next-line id-length
            { w: 1, useNewUrlParser: true, useUnifiedTopology: true });
            return connection;
        });
        const { pathname } = new url_1.URL(connectionString);
        const databaseName = pathname.slice(1);
        const db = client.db(databaseName);
        db.on('close', MongoDbLockStore.onUnexpectedClose);
        const collections = {
            locks: db.collection(collectionNames.locks)
        };
        return new MongoDbLockStore({
            client,
            db,
            collectionNames,
            collections
        });
    }
    async removeExpiredLocks() {
        await this.collections.locks.deleteMany({ expiresAt: { $lt: Date.now() } });
    }
    async acquireLock({ value, expiresAt = Number.MAX_SAFE_INTEGER }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        // From time to time, we should removed expired locks. Doing this before
        // acquiring new ones is a good point in time for this.
        await this.removeExpiredLocks();
        const hash = getHash_1.getHash({ value });
        try {
            await this.collections.locks.insertOne({ value: hash, expiresAt });
        }
        catch {
            throw new errors.LockAcquireFailed('Failed to acquire lock.');
        }
    }
    async isLocked({ value }) {
        const hash = getHash_1.getHash({ value });
        const lock = await this.collections.locks.findOne({
            value: hash,
            expiresAt: { $gte: Date.now() }
        });
        if (!lock) {
            return false;
        }
        return true;
    }
    async renewLock({ value, expiresAt }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        // From time to time, we should removed expired locks. Doing this before
        // renewing existing ones is a good point in time for this.
        await this.removeExpiredLocks();
        const hash = getHash_1.getHash({ value });
        const { modifiedCount } = await this.collections.locks.updateOne({ value: hash }, { $set: { expiresAt } });
        if (modifiedCount === 0) {
            throw new errors.LockRenewalFailed('Failed to renew lock.');
        }
    }
    async releaseLock({ value }) {
        // From time to time, we should removed expired locks. Doing this before
        // releasing existing ones is a good point in time for this.
        await this.removeExpiredLocks();
        const hash = getHash_1.getHash({ value });
        await this.collections.locks.deleteOne({ value: hash });
    }
    async setup() {
        await this.collections.locks.createIndexes([{
                key: { value: 1 },
                name: `${this.collectionNames.locks}_value`,
                unique: true
            }]);
    }
    async destroy() {
        this.db.removeListener('close', MongoDbLockStore.onUnexpectedClose);
        await this.client.close(true);
    }
}
exports.MongoDbLockStore = MongoDbLockStore;
//# sourceMappingURL=MongoDbLockStore.js.map