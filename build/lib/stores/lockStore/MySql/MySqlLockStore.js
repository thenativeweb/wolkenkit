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
exports.MySqlLockStore = void 0;
const createPoolWithDefaults_1 = require("../../utils/mySql/createPoolWithDefaults");
const getHash_1 = require("../../../common/utils/crypto/getHash");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const runQuery_1 = require("../../utils/mySql/runQuery");
const errors = __importStar(require("../../../common/errors"));
class MySqlLockStore {
    constructor({ tableNames, pool }) {
        this.tableNames = tableNames;
        this.pool = pool;
    }
    static onUnexpectedClose() {
        throw new Error('Connection closed unexpectedly.');
    }
    static releaseConnection({ connection }) {
        connection.removeListener('end', MySqlLockStore.onUnexpectedClose);
        connection.release();
    }
    async getDatabase() {
        const database = await retry_ignore_abort_1.retry(async () => new Promise((resolve, reject) => {
            this.pool.getConnection((err, poolConnection) => {
                if (err) {
                    return reject(err);
                }
                resolve(poolConnection);
            });
        }));
        return database;
    }
    static async create({ hostName, port, userName, password, database, tableNames }) {
        const pool = createPoolWithDefaults_1.createPoolWithDefaults({
            hostName,
            port,
            userName,
            password,
            database
        });
        pool.on('connection', (connection) => {
            connection.on('error', (err) => {
                throw err;
            });
            connection.on('end', MySqlLockStore.onUnexpectedClose);
        });
        return new MySqlLockStore({
            tableNames,
            pool
        });
    }
    async removeExpiredLocks({ connection }) {
        await runQuery_1.runQuery({
            connection,
            query: `DELETE FROM \`${this.tableNames.locks}\` WHERE expiresAt < ?;`,
            parameters: [Date.now()]
        });
    }
    async acquireLock({ value, expiresAt = Number.MAX_SAFE_INTEGER }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        const connection = await this.getDatabase();
        const hash = getHash_1.getHash({ value });
        try {
            // From time to time, we should removed expired locks. Doing this before
            // acquiring new ones is a good point in time for this.
            await this.removeExpiredLocks({ connection });
            try {
                await runQuery_1.runQuery({
                    connection,
                    query: `
            INSERT INTO \`${this.tableNames.locks}\` (expiresAt, value)
              VALUES (?, ?);
          `,
                    parameters: [expiresAt, hash]
                });
            }
            catch {
                throw new errors.LockAcquireFailed('Failed to acquire lock.');
            }
        }
        finally {
            MySqlLockStore.releaseConnection({ connection });
        }
    }
    async isLocked({ value }) {
        const connection = await this.getDatabase();
        const hash = getHash_1.getHash({ value });
        try {
            const [rows] = await runQuery_1.runQuery({
                connection,
                query: `
          SELECT 1
            FROM \`${this.tableNames.locks}\`
            WHERE value = ? AND expiresAt >= ?;
        `,
                parameters: [hash, Date.now()]
            });
            if (rows.length === 0) {
                return false;
            }
            return true;
        }
        finally {
            MySqlLockStore.releaseConnection({ connection });
        }
    }
    async renewLock({ value, expiresAt }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        const connection = await this.getDatabase();
        const hash = getHash_1.getHash({ value });
        try {
            // From time to time, we should removed expired locks. Doing this before
            // renewing existing ones is a good point in time for this.
            await this.removeExpiredLocks({ connection });
            const [rows] = await runQuery_1.runQuery({
                connection,
                query: `
          UPDATE \`${this.tableNames.locks}\`
            SET expiresAt = ?
            WHERE value = ?;
        `,
                parameters: [expiresAt, hash]
            });
            if (rows.changedRows === 0) {
                throw new errors.LockRenewalFailed('Failed to renew lock.');
            }
        }
        finally {
            MySqlLockStore.releaseConnection({ connection });
        }
    }
    async releaseLock({ value }) {
        const connection = await this.getDatabase();
        const hash = getHash_1.getHash({ value });
        try {
            // From time to time, we should removed expired locks. Doing this before
            // releasing existing ones is a good point in time for this.
            await this.removeExpiredLocks({ connection });
            await runQuery_1.runQuery({
                connection,
                query: `
          DELETE FROM \`${this.tableNames.locks}\`
            WHERE value = ?;
        `,
                parameters: [hash]
            });
        }
        finally {
            MySqlLockStore.releaseConnection({ connection });
        }
    }
    async setup() {
        const connection = await this.getDatabase();
        await runQuery_1.runQuery({
            connection,
            query: `
        CREATE TABLE IF NOT EXISTS \`${this.tableNames.locks}\` (
          value CHAR(64) NOT NULL,
          expiresAt BIGINT NOT NULL,

          PRIMARY KEY(value)
        );
      `
        });
        MySqlLockStore.releaseConnection({ connection });
    }
    async destroy() {
        await new Promise((resolve, reject) => {
            this.pool.end((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}
exports.MySqlLockStore = MySqlLockStore;
//# sourceMappingURL=MySqlLockStore.js.map