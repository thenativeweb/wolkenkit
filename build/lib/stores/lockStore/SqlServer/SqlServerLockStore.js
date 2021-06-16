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
exports.SqlServerLockStore = void 0;
const getHash_1 = require("../../../common/utils/crypto/getHash");
const mssql_1 = require("mssql");
const errors = __importStar(require("../../../common/errors"));
class SqlServerLockStore {
    constructor({ pool, tableNames }) {
        this.pool = pool;
        this.tableNames = tableNames;
    }
    static onUnexpectedClose() {
        throw new Error('Connection closed unexpectedly.');
    }
    static async create({ hostName, port, userName, password, database, encryptConnection = false, tableNames }) {
        const pool = new mssql_1.ConnectionPool({
            server: hostName,
            port,
            user: userName,
            password,
            database,
            options: {
                enableArithAbort: true,
                encrypt: encryptConnection,
                trustServerCertificate: false
            }
        });
        pool.on('error', () => {
            SqlServerLockStore.onUnexpectedClose();
        });
        await pool.connect();
        return new SqlServerLockStore({ pool, tableNames });
    }
    async removeExpiredLocks() {
        const requestDelete = this.pool.request();
        requestDelete.input('now', mssql_1.TYPES.BigInt, Date.now());
        await requestDelete.query(`
      DELETE FROM [${this.tableNames.locks}] WHERE [expiresAt] < @now;
    `);
    }
    async acquireLock({ value, expiresAt = Number.MAX_SAFE_INTEGER }) {
        if (expiresAt < Date.now()) {
            throw new errors.ExpirationInPast('A lock must not expire in the past.');
        }
        // From time to time, we should removed expired locks. Doing this before
        // acquiring new ones is a good point in time for this.
        await this.removeExpiredLocks();
        const request = this.pool.request();
        const hash = getHash_1.getHash({ value });
        request.input('hash', mssql_1.TYPES.NChar, hash);
        request.input('expiresAt', mssql_1.TYPES.BigInt, expiresAt);
        try {
            await request.query(`
        INSERT INTO [${this.tableNames.locks}] ([value], [expiresAt])
          VALUES (@hash, @expiresAt);
      `);
        }
        catch {
            throw new errors.LockAcquireFailed('Failed to acquire lock.');
        }
    }
    async isLocked({ value }) {
        const request = this.pool.request();
        const hash = getHash_1.getHash({ value });
        request.input('hash', mssql_1.TYPES.NChar, hash);
        request.input('now', mssql_1.TYPES.BigInt, Date.now());
        const { recordset } = await request.query(`
      SELECT 1
        FROM [${this.tableNames.locks}]
        WHERE [value] = @hash AND [expiresAt] >= @now;
    `);
        if (recordset.length === 0) {
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
        const request = this.pool.request();
        const hash = getHash_1.getHash({ value });
        request.input('hash', mssql_1.TYPES.NChar, hash);
        request.input('now', mssql_1.TYPES.BigInt, Date.now());
        request.input('expiresAt', mssql_1.TYPES.BigInt, expiresAt);
        const { rowsAffected } = await request.query(`
      UPDATE [${this.tableNames.locks}]
        SET [expiresAt] = @expiresAt
        WHERE [value] = @hash;
    `);
        if (rowsAffected[0] === 0) {
            throw new errors.LockRenewalFailed('Failed to renew lock.');
        }
    }
    async releaseLock({ value }) {
        // From time to time, we should removed expired locks. Doing this before
        // releasing existing ones is a good point in time for this.
        await this.removeExpiredLocks();
        const request = this.pool.request();
        const hash = getHash_1.getHash({ value });
        request.input('hash', mssql_1.TYPES.NChar, hash);
        request.input('now', mssql_1.TYPES.BigInt, Date.now());
        await request.query(`
      DELETE [${this.tableNames.locks}]
        WHERE [value] = @hash;
    `);
    }
    async setup() {
        try {
            await this.pool.query(`
        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.locks}')
          BEGIN
            CREATE TABLE [${this.tableNames.locks}] (
              [value] NCHAR(64) NOT NULL,
              [expiresAt] BIGINT NOT NULL,

              CONSTRAINT [${this.tableNames.locks}_pk] PRIMARY KEY([value])
            );
          END
      `);
        }
        catch (ex) {
            if (!/There is already an object named.*_locks/u.test(ex.message)) {
                throw ex;
            }
            // When multiple clients initialize at the same time, e.g. during
            // integration tests, SQL Server might throw an error. In this case we
            // simply ignore it.
        }
    }
    async destroy() {
        await this.pool.close();
    }
}
exports.SqlServerLockStore = SqlServerLockStore;
//# sourceMappingURL=SqlServerLockStore.js.map