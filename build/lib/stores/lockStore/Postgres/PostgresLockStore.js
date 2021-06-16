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
exports.PostgresLockStore = void 0;
const getHash_1 = require("../../../common/utils/crypto/getHash");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const pg_1 = require("pg");
const errors = __importStar(require("../../../common/errors"));
class PostgresLockStore {
    constructor({ tableNames, pool, disconnectWatcher }) {
        this.tableNames = tableNames;
        this.pool = pool;
        this.disconnectWatcher = disconnectWatcher;
    }
    static onUnexpectedClose() {
        throw new Error('Connection closed unexpectedly.');
    }
    static async getDatabase(pool) {
        const database = await retry_ignore_abort_1.retry(async () => {
            const connection = await pool.connect();
            return connection;
        });
        return database;
    }
    static async create({ hostName, port, userName, password, database, encryptConnection, tableNames }) {
        const pool = new pg_1.Pool({
            host: hostName,
            port,
            user: userName,
            password,
            database,
            ssl: encryptConnection
        });
        pool.on('error', (err) => {
            throw err;
        });
        const disconnectWatcher = new pg_1.Client({
            host: hostName,
            port,
            user: userName,
            password,
            database,
            ssl: encryptConnection
        });
        disconnectWatcher.on('end', PostgresLockStore.onUnexpectedClose);
        disconnectWatcher.on('error', (err) => {
            throw err;
        });
        await disconnectWatcher.connect();
        return new PostgresLockStore({
            tableNames,
            pool,
            disconnectWatcher
        });
    }
    async removeExpiredLocks({ connection }) {
        await connection.query({
            name: 'delete expired locks',
            text: `DELETE FROM "${this.tableNames.locks}" WHERE "expiresAt" < $1`,
            values: [Date.now()]
        });
    }
    async acquireLock({ value, expiresAt = Number.MAX_SAFE_INTEGER }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        const connection = await PostgresLockStore.getDatabase(this.pool);
        const hash = getHash_1.getHash({ value });
        try {
            // From time to time, we should removed expired locks. Doing this before
            // acquiring new ones is a good point in time for this.
            await this.removeExpiredLocks({ connection });
            try {
                await connection.query({
                    name: `try to acquire lock`,
                    text: `
            INSERT INTO "${this.tableNames.locks}" ("value", "expiresAt")
              VALUES ($1, $2)
          `,
                    values: [hash, expiresAt]
                });
            }
            catch {
                throw new errors.LockAcquireFailed('Failed to acquire lock.');
            }
        }
        finally {
            connection.release();
        }
    }
    async isLocked({ value }) {
        const connection = await PostgresLockStore.getDatabase(this.pool);
        const hash = getHash_1.getHash({ value });
        try {
            const result = await connection.query({
                name: 'get lock',
                text: `
          SELECT 1
            FROM "${this.tableNames.locks}"
            WHERE "value" = $1 AND "expiresAt" >= $2
        `,
                values: [hash, Date.now()]
            });
            if (result.rows.length === 0) {
                return false;
            }
            return true;
        }
        finally {
            connection.release();
        }
    }
    async renewLock({ value, expiresAt }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        const connection = await PostgresLockStore.getDatabase(this.pool);
        const hash = getHash_1.getHash({ value });
        try {
            // From time to time, we should removed expired locks. Doing this before
            // renewing existing ones is a good point in time for this.
            await this.removeExpiredLocks({ connection });
            const result = await connection.query({
                name: 'renew lock',
                text: `
          UPDATE "${this.tableNames.locks}"
            SET "expiresAt" = $2
            WHERE "value" = $1
        `,
                values: [hash, expiresAt]
            });
            if (result.rowCount === 0) {
                throw new errors.LockRenewalFailed('Failed to renew lock.');
            }
        }
        finally {
            connection.release();
        }
    }
    async releaseLock({ value }) {
        const connection = await PostgresLockStore.getDatabase(this.pool);
        const hash = getHash_1.getHash({ value });
        try {
            // From time to time, we should removed expired locks. Doing this before
            // releasing existing ones is a good point in time for this.
            await this.removeExpiredLocks({ connection });
            await connection.query({
                name: 'remove lock',
                text: `
          DELETE FROM "${this.tableNames.locks}"
            WHERE "value" = $1
        `,
                values: [hash]
            });
        }
        finally {
            connection.release();
        }
    }
    async setup() {
        const connection = await PostgresLockStore.getDatabase(this.pool);
        try {
            await retry_ignore_abort_1.retry(async () => {
                await connection.query(`
          CREATE TABLE IF NOT EXISTS "${this.tableNames.locks}" (
            "value" CHAR(64) NOT NULL,
            "expiresAt" BIGINT NOT NULL,

            CONSTRAINT "${this.tableNames.locks}_pk" PRIMARY KEY("value")
          );
        `);
            }, {
                retries: 3,
                minTimeout: 100,
                factor: 1
            });
        }
        finally {
            connection.release();
        }
    }
    async destroy() {
        this.disconnectWatcher.removeListener('end', PostgresLockStore.onUnexpectedClose);
        await this.disconnectWatcher.end();
        await this.pool.end();
    }
}
exports.PostgresLockStore = PostgresLockStore;
//# sourceMappingURL=PostgresLockStore.js.map