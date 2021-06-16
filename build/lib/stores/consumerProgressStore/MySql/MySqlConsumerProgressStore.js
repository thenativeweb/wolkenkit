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
exports.MySqlConsumerProgressStore = void 0;
const createPoolWithDefaults_1 = require("../../utils/mySql/createPoolWithDefaults");
const getHash_1 = require("../../../common/utils/crypto/getHash");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const runQuery_1 = require("../../utils/mySql/runQuery");
const withTransaction_1 = require("../../utils/mySql/withTransaction");
const errors = __importStar(require("../../../common/errors"));
class MySqlConsumerProgressStore {
    constructor({ tableNames, pool }) {
        this.tableNames = tableNames;
        this.pool = pool;
    }
    static onUnexpectedClose() {
        throw new Error('Connection closed unexpectedly.');
    }
    static releaseConnection({ connection }) {
        connection.removeListener('end', MySqlConsumerProgressStore.onUnexpectedClose);
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
            connection.on('end', MySqlConsumerProgressStore.onUnexpectedClose);
        });
        return new MySqlConsumerProgressStore({
            tableNames,
            pool
        });
    }
    async getProgress({ consumerId, aggregateIdentifier }) {
        const connection = await this.getDatabase();
        const hash = getHash_1.getHash({ value: consumerId });
        try {
            const [rows] = await runQuery_1.runQuery({
                connection,
                query: `
          SELECT revision, isReplayingFrom, isReplayingTo
            FROM \`${this.tableNames.progress}\`
            WHERE consumerId = ? AND aggregateId = UuidToBin(?);
        `,
                parameters: [hash, aggregateIdentifier.aggregate.id]
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
            MySqlConsumerProgressStore.releaseConnection({ connection });
        }
    }
    async setProgress({ consumerId, aggregateIdentifier, revision }) {
        const hash = getHash_1.getHash({ value: consumerId });
        if (revision < 0) {
            throw new errors.ParameterInvalid('Revision must be at least zero.');
        }
        await withTransaction_1.withTransaction({
            getConnection: async () => await this.getDatabase(),
            fn: async ({ connection }) => {
                var _a;
                const [rows] = await runQuery_1.runQuery({
                    connection,
                    query: `
            UPDATE \`${this.tableNames.progress}\`
              SET revision = ?
              WHERE consumerId = ? AND aggregateId = UuidToBin(?) AND revision < ?;
          `,
                    parameters: [revision, hash, aggregateIdentifier.aggregate.id, revision]
                });
                if (rows.affectedRows === 1) {
                    return;
                }
                try {
                    await runQuery_1.runQuery({
                        connection,
                        query: `
              INSERT INTO \`${this.tableNames.progress}\`
                (consumerId, aggregateId, revision)
                VALUES (?, UuidToBin(?), ?);
            `,
                        parameters: [hash, aggregateIdentifier.aggregate.id, revision]
                    });
                }
                catch (ex) {
                    if (ex.code === 'ER_DUP_ENTRY' && ((_a = ex.sqlMessage) === null || _a === void 0 ? void 0 : _a.endsWith('for key \'PRIMARY\''))) {
                        throw new errors.RevisionTooLow();
                    }
                    throw ex;
                }
            },
            async releaseConnection({ connection }) {
                MySqlConsumerProgressStore.releaseConnection({ connection });
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
            getConnection: async () => await this.getDatabase(),
            fn: async ({ connection }) => {
                var _a;
                let rows;
                if (!isReplaying) {
                    [rows] = await runQuery_1.runQuery({
                        connection,
                        query: `
            UPDATE \`${this.tableNames.progress}\`
              SET isReplayingFrom = NULL, isReplayingTo = NULL
              WHERE consumerId = ? AND aggregateId = UuidToBin(?);
          `,
                        parameters: [hash, aggregateIdentifier.aggregate.id]
                    });
                }
                else {
                    [rows] = await runQuery_1.runQuery({
                        connection,
                        query: `
            UPDATE \`${this.tableNames.progress}\`
              SET isReplayingFrom = ?, isReplayingTo = ?
              WHERE consumerId = ? AND aggregateId = UuidToBin(?) AND isReplayingFrom IS NULL AND isReplayingTo IS NULL;
          `,
                        parameters: [isReplaying.from, isReplaying.to, hash, aggregateIdentifier.aggregate.id]
                    });
                }
                if (rows.affectedRows === 1) {
                    return;
                }
                try {
                    await runQuery_1.runQuery({
                        connection,
                        query: `
              INSERT INTO \`${this.tableNames.progress}\`
                (consumerId, aggregateId, revision, isReplayingFrom, isReplayingTo)
                VALUES (?, UuidToBin(?), 0, ?, ?);
            `,
                        parameters: [hash, aggregateIdentifier.aggregate.id, isReplaying ? isReplaying.from : null, isReplaying ? isReplaying.to : null]
                    });
                }
                catch (ex) {
                    if (ex.code === 'ER_DUP_ENTRY' && ((_a = ex.sqlMessage) === null || _a === void 0 ? void 0 : _a.endsWith('for key \'PRIMARY\''))) {
                        throw new errors.FlowIsAlreadyReplaying();
                    }
                    throw ex;
                }
            },
            async releaseConnection({ connection }) {
                MySqlConsumerProgressStore.releaseConnection({ connection });
            }
        });
    }
    async resetProgress({ consumerId }) {
        const connection = await this.getDatabase();
        const hash = getHash_1.getHash({ value: consumerId });
        try {
            await runQuery_1.runQuery({
                connection,
                query: `
          DELETE FROM \`${this.tableNames.progress}\`
            WHERE consumerId = ?;
        `,
                parameters: [hash]
            });
        }
        finally {
            MySqlConsumerProgressStore.releaseConnection({ connection });
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
            getConnection: async () => await this.getDatabase(),
            fn: async ({ connection }) => {
                const [rows] = await runQuery_1.runQuery({
                    connection,
                    query: `
            UPDATE \`${this.tableNames.progress}\`
              SET revision = ?, isReplayingFrom = NULL, isReplayingTo = NULL
              WHERE consumerId = ? AND aggregateId = UuidToBin(?);
          `,
                    parameters: [revision, hash, aggregateIdentifier.aggregate.id, revision]
                });
                if (rows.affectedRows === 1) {
                    return;
                }
                await runQuery_1.runQuery({
                    connection,
                    query: `
              INSERT INTO \`${this.tableNames.progress}\`
                (consumerId, aggregateId, revision)
                VALUES (?, UuidToBin(?), ?);
            `,
                    parameters: [hash, aggregateIdentifier.aggregate.id, revision]
                });
            },
            async releaseConnection({ connection }) {
                MySqlConsumerProgressStore.releaseConnection({ connection });
            }
        });
    }
    async setup() {
        const connection = await this.getDatabase();
        const createUuidToBinFunction = `
      CREATE FUNCTION UuidToBin(_uuid CHAR(36))
        RETURNS BINARY(16)
        RETURN UNHEX(CONCAT(
          SUBSTR(_uuid, 15, 4),
          SUBSTR(_uuid, 10, 4),
          SUBSTR(_uuid, 1, 8),
          SUBSTR(_uuid, 20, 4),
          SUBSTR(_uuid, 25)
        ));
    `;
        try {
            await runQuery_1.runQuery({ connection, query: createUuidToBinFunction });
        }
        catch (ex) {
            // If the function already exists, we can ignore this error; otherwise
            // rethrow it. Generally speaking, this should be done using a SQL clause
            // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
            // there is a ready-made function UUID_TO_BIN, but this is only available
            // from MySQL 8.0 upwards.
            if (!ex.message.includes('FUNCTION UuidToBin already exists')) {
                throw ex;
            }
        }
        const createUuidFromBinFunction = `
      CREATE FUNCTION UuidFromBin(_bin BINARY(16))
        RETURNS CHAR(36)
        RETURN LCASE(CONCAT_WS('-',
          HEX(SUBSTR(_bin,  5, 4)),
          HEX(SUBSTR(_bin,  3, 2)),
          HEX(SUBSTR(_bin,  1, 2)),
          HEX(SUBSTR(_bin,  9, 2)),
          HEX(SUBSTR(_bin, 11))
        ));
    `;
        try {
            await runQuery_1.runQuery({ connection, query: createUuidFromBinFunction });
        }
        catch (ex) {
            // If the function already exists, we can ignore this error; otherwise
            // rethrow it. Generally speaking, this should be done using a SQL clause
            // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
            // there is a ready-made function BIN_TO_UUID, but this is only available
            // from MySQL 8.0 upwards.
            if (!ex.message.includes('FUNCTION UuidFromBin already exists')) {
                throw ex;
            }
        }
        await runQuery_1.runQuery({
            connection,
            query: `
        CREATE TABLE IF NOT EXISTS \`${this.tableNames.progress}\` (
          consumerId CHAR(64) NOT NULL,
          aggregateId BINARY(16) NOT NULL,
          revision INT NOT NULL,
          isReplayingFrom INT,
          isReplayingTo INT,

          PRIMARY KEY(consumerId, aggregateId)
        );
      `
        });
        MySqlConsumerProgressStore.releaseConnection({ connection });
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
exports.MySqlConsumerProgressStore = MySqlConsumerProgressStore;
//# sourceMappingURL=MySqlConsumerProgressStore.js.map