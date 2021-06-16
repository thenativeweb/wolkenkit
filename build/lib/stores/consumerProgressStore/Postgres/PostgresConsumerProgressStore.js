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
exports.PostgresConsumerProgressStore = void 0;
const getHash_1 = require("../../../common/utils/crypto/getHash");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const withTransaction_1 = require("../../utils/postgres/withTransaction");
const pg_1 = require("pg");
const errors = __importStar(require("../../../common/errors"));
class PostgresConsumerProgressStore {
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
        disconnectWatcher.on('end', PostgresConsumerProgressStore.onUnexpectedClose);
        disconnectWatcher.on('error', (err) => {
            throw err;
        });
        await disconnectWatcher.connect();
        return new PostgresConsumerProgressStore({
            tableNames,
            pool,
            disconnectWatcher
        });
    }
    async getProgress({ consumerId, aggregateIdentifier }) {
        const connection = await PostgresConsumerProgressStore.getDatabase(this.pool);
        const hash = getHash_1.getHash({ value: consumerId });
        try {
            const { rows } = await connection.query({
                name: 'get progress',
                text: `
          SELECT "revision", "isReplayingFrom", "isReplayingTo"
            FROM "${this.tableNames.progress}"
            WHERE "consumerId" = $1 AND "aggregateId" = $2;
        `,
                values: [hash, aggregateIdentifier.aggregate.id]
            });
            if (rows.length === 0) {
                return { revision: 0, isReplaying: false };
            }
            let isReplaying = false;
            if (rows[0].isReplayingFrom && rows[0].isReplayingTo) {
                isReplaying = { from: rows[0].isReplayingFrom, to: rows[0].isReplayingTo };
            }
            return { revision: rows[0].revision, isReplaying };
        }
        finally {
            connection.release();
        }
    }
    async setProgress({ consumerId, aggregateIdentifier, revision }) {
        if (revision < 0) {
            throw new errors.ParameterInvalid('Revision must be at least zero.');
        }
        const hash = getHash_1.getHash({ value: consumerId });
        await withTransaction_1.withTransaction({
            getConnection: async () => await PostgresConsumerProgressStore.getDatabase(this.pool),
            fn: async ({ connection }) => {
                var _a;
                const { rowCount } = await connection.query({
                    name: 'update progress',
                    text: `
            UPDATE "${this.tableNames.progress}"
              SET "revision" = $1
              WHERE "consumerId" = $2 AND "aggregateId" = $3 AND "revision" < $4;
          `,
                    values: [revision, hash, aggregateIdentifier.aggregate.id, revision]
                });
                if (rowCount === 1) {
                    return;
                }
                try {
                    await connection.query({
                        name: 'insert progress with default is replaying',
                        text: `
              INSERT INTO "${this.tableNames.progress}"
                ("consumerId", "aggregateId", "revision")
                VALUES ($1, $2, $3);
            `,
                        values: [hash, aggregateIdentifier.aggregate.id, revision]
                    });
                }
                catch (ex) {
                    if (ex.code === '23505' && ((_a = ex.detail) === null || _a === void 0 ? void 0 : _a.startsWith('Key ("consumerId", "aggregateId")'))) {
                        throw new errors.RevisionTooLow();
                    }
                    throw ex;
                }
            },
            async releaseConnection({ connection }) {
                connection.release();
            }
        });
    }
    async setIsReplaying({ consumerId, aggregateIdentifier, isReplaying }) {
        if (isReplaying) {
            if (isReplaying.from < 1) {
                throw new errors.ParameterInvalid('Replays must start from at least one.');
            }
            if (isReplaying.from > isReplaying.to) {
                throw new errors.ParameterInvalid('Replays must start at an earlier revision than where they end at.');
            }
        }
        const hash = getHash_1.getHash({ value: consumerId });
        await withTransaction_1.withTransaction({
            getConnection: async () => await PostgresConsumerProgressStore.getDatabase(this.pool),
            fn: async ({ connection }) => {
                var _a;
                let rowCount;
                if (!isReplaying) {
                    ({ rowCount } = await connection.query({
                        name: 'update is replaying to false',
                        text: `
            UPDATE "${this.tableNames.progress}"
              SET "isReplayingFrom" = NULL, "isReplayingTo" = NULL
              WHERE "consumerId" = $1 AND "aggregateId" = $2;
          `,
                        values: [hash, aggregateIdentifier.aggregate.id]
                    }));
                }
                else {
                    ({ rowCount } = await connection.query({
                        name: 'update is replaying to values',
                        text: `
            UPDATE "${this.tableNames.progress}"
              SET "isReplayingFrom" = $1, "isReplayingTo" = $2
              WHERE "consumerId" = $3 AND "aggregateId" = $4 AND "isReplayingFrom" IS NULL AND "isReplayingTo" IS NULL;
          `,
                        values: [isReplaying.from, isReplaying.to, hash, aggregateIdentifier.aggregate.id]
                    }));
                }
                if (rowCount === 1) {
                    return;
                }
                try {
                    await connection.query({
                        name: 'insert progress with default revision',
                        text: `
              INSERT INTO "${this.tableNames.progress}"
                ("consumerId", "aggregateId", "revision", "isReplayingFrom", "isReplayingTo")
                VALUES ($1, $2, 0, $3, $4);
            `,
                        values: [hash, aggregateIdentifier.aggregate.id, isReplaying ? isReplaying.from : null, isReplaying ? isReplaying.to : null]
                    });
                }
                catch (ex) {
                    if (ex.code === '23505' && ((_a = ex.detail) === null || _a === void 0 ? void 0 : _a.startsWith('Key ("consumerId", "aggregateId")'))) {
                        throw new errors.FlowIsAlreadyReplaying();
                    }
                    throw ex;
                }
            },
            async releaseConnection({ connection }) {
                connection.release();
            }
        });
    }
    async resetProgress({ consumerId }) {
        const connection = await PostgresConsumerProgressStore.getDatabase(this.pool);
        const hash = getHash_1.getHash({ value: consumerId });
        try {
            await connection.query({
                name: 'reset progress',
                text: `
          DELETE FROM "${this.tableNames.progress}"
            WHERE "consumerId" = $1
        `,
                values: [hash]
            });
        }
        finally {
            connection.release();
        }
    }
    async resetProgressToRevision({ consumerId, aggregateIdentifier, revision }) {
        if (revision < 0) {
            throw new errors.ParameterInvalid('Revision must be at least zero.');
        }
        const { revision: currentRevision } = await this.getProgress({
            consumerId,
            aggregateIdentifier
        });
        if (currentRevision < revision) {
            throw new errors.ParameterInvalid('Can not reset a consumer to a newer revision than it currently is at.');
        }
        const hash = getHash_1.getHash({ value: consumerId });
        await withTransaction_1.withTransaction({
            getConnection: async () => await PostgresConsumerProgressStore.getDatabase(this.pool),
            fn: async ({ connection }) => {
                const { rowCount } = await connection.query({
                    name: 'reset progress to revision',
                    text: `
            UPDATE "${this.tableNames.progress}"
              SET "revision" = $1, "isReplayingFrom" = NULL, "isReplayingTo" = NULL
              WHERE "consumerId" = $2 AND "aggregateId" = $3;
          `,
                    values: [revision, hash, aggregateIdentifier.aggregate.id]
                });
                if (rowCount === 1) {
                    return;
                }
                await connection.query({
                    name: 'insert progress with default is replaying for resetting purposes',
                    text: `
              INSERT INTO "${this.tableNames.progress}"
                ("consumerId", "aggregateId", "revision")
                VALUES ($1, $2, $3);
            `,
                    values: [hash, aggregateIdentifier.aggregate.id, revision]
                });
            },
            async releaseConnection({ connection }) {
                connection.release();
            }
        });
    }
    async setup() {
        const connection = await PostgresConsumerProgressStore.getDatabase(this.pool);
        try {
            await retry_ignore_abort_1.retry(async () => {
                await connection.query(`
          CREATE TABLE IF NOT EXISTS "${this.tableNames.progress}" (
            "consumerId" CHAR(64) NOT NULL,
            "aggregateId" uuid NOT NULL,
            "revision" integer NOT NULL,
            "isReplayingFrom" integer,
            "isReplayingTo" integer,

            CONSTRAINT "${this.tableNames.progress}_pk" PRIMARY KEY("consumerId", "aggregateId")
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
        this.disconnectWatcher.removeListener('end', PostgresConsumerProgressStore.onUnexpectedClose);
        await this.disconnectWatcher.end();
        await this.pool.end();
    }
}
exports.PostgresConsumerProgressStore = PostgresConsumerProgressStore;
//# sourceMappingURL=PostgresConsumerProgressStore.js.map