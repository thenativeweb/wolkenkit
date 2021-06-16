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
exports.SqlServerConsumerProgressStore = void 0;
const getHash_1 = require("../../../common/utils/crypto/getHash");
const mssql_1 = require("mssql");
const errors = __importStar(require("../../../common/errors"));
class SqlServerConsumerProgressStore {
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
            SqlServerConsumerProgressStore.onUnexpectedClose();
        });
        await pool.connect();
        return new SqlServerConsumerProgressStore({ pool, tableNames });
    }
    async getProgress({ consumerId, aggregateIdentifier }) {
        const request = this.pool.request();
        const hash = getHash_1.getHash({ value: consumerId });
        request.input('consumerId', mssql_1.TYPES.NChar, hash);
        request.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
        const { recordset } = await request.query(`
      SELECT [revision], [isReplayingFrom], [isReplayingTo]
        FROM [${this.tableNames.progress}]
        WHERE [consumerId] = @consumerId AND [aggregateId] = @aggregateId;
    `);
        if (recordset.length === 0) {
            return { revision: 0, isReplaying: false };
        }
        const { revision, isReplayingFrom, isReplayingTo } = recordset[0];
        const isReplaying = isReplayingFrom ?
            { from: isReplayingFrom, to: isReplayingTo } :
            false;
        return { revision, isReplaying };
    }
    async setProgress({ consumerId, aggregateIdentifier, revision }) {
        if (revision < 0) {
            throw new errors.ParameterInvalid('Revision must be at least zero.');
        }
        const hash = getHash_1.getHash({ value: consumerId });
        const transaction = this.pool.transaction();
        await transaction.begin();
        try {
            const requestUpdate = transaction.request();
            requestUpdate.input('revision', mssql_1.TYPES.Int, revision);
            requestUpdate.input('consumerId', mssql_1.TYPES.NChar, hash);
            requestUpdate.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
            const { rowsAffected } = await requestUpdate.query(`
        UPDATE [${this.tableNames.progress}]
          SET [revision] = @revision
          WHERE [consumerId] = @consumerId AND [aggregateId] = @aggregateId AND [revision] < @revision;
      `);
            if (rowsAffected[0] === 1) {
                await transaction.commit();
                return;
            }
            try {
                const requestInsert = transaction.request();
                requestInsert.input('consumerId', mssql_1.TYPES.NChar, hash);
                requestInsert.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
                requestInsert.input('revision', mssql_1.TYPES.Int, revision);
                await requestInsert.query(`
          INSERT INTO [${this.tableNames.progress}]
            ([consumerId], [aggregateId], [revision], [isReplayingFrom], [isReplayingTo])
            VALUES (@consumerId, @aggregateId, @revision, NULL, NULL);
        `);
            }
            catch (ex) {
                if (ex instanceof mssql_1.RequestError &&
                    ex.code === 'EREQUEST' &&
                    ex.number === 2627 &&
                    ex.message.startsWith('Violation of PRIMARY KEY constraint')) {
                    throw new errors.RevisionTooLow();
                }
                throw ex;
            }
            await transaction.commit();
        }
        catch (ex) {
            await transaction.rollback();
            throw ex;
        }
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
        const transaction = this.pool.transaction();
        await transaction.begin();
        try {
            const requestUpdate = transaction.request();
            requestUpdate.input('consumerId', mssql_1.TYPES.NChar, hash);
            requestUpdate.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
            requestUpdate.input('isReplayingFrom', mssql_1.TYPES.Int, isReplaying ? isReplaying.from : null);
            requestUpdate.input('isReplayingTo', mssql_1.TYPES.Int, isReplaying ? isReplaying.to : null);
            const { rowsAffected } = await (isReplaying ?
                requestUpdate.query(`
          UPDATE [${this.tableNames.progress}]
            SET
              [isReplayingFrom] = @isReplayingFrom,
              [isReplayingTo] = @isReplayingTo
            WHERE
              [consumerId] = @consumerId AND
              [aggregateId] = @aggregateId AND
              [isReplayingFrom] IS NULL AND
              [isReplayingTo] IS NULL;
        `) :
                requestUpdate.query(`
          UPDATE [${this.tableNames.progress}]
            SET
              [isReplayingFrom] = @isReplayingFrom,
              [isReplayingTo] = @isReplayingTo
            WHERE
              [consumerId] = @consumerId AND
              [aggregateId] = @aggregateId;
        `));
            if (rowsAffected[0] === 1) {
                await transaction.commit();
                return;
            }
            try {
                const requestInsert = transaction.request();
                requestInsert.input('consumerId', mssql_1.TYPES.NChar, hash);
                requestInsert.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
                requestInsert.input('isReplayingFrom', mssql_1.TYPES.Int, isReplaying ? isReplaying.from : null);
                requestInsert.input('isReplayingTo', mssql_1.TYPES.Int, isReplaying ? isReplaying.to : null);
                await requestInsert.query(`
          INSERT INTO [${this.tableNames.progress}]
            ([consumerId], [aggregateId], [revision], [isReplayingFrom], [isReplayingTo])
            VALUES (@consumerId, @aggregateId, 0, @isReplayingFrom, @isReplayingTo);
        `);
            }
            catch (ex) {
                if (ex instanceof mssql_1.RequestError &&
                    ex.code === 'EREQUEST' &&
                    ex.number === 2627 &&
                    ex.message.startsWith('Violation of PRIMARY KEY constraint')) {
                    throw new errors.FlowIsAlreadyReplaying();
                }
                throw ex;
            }
            await transaction.commit();
        }
        catch (ex) {
            await transaction.rollback();
            throw ex;
        }
    }
    async resetProgress({ consumerId }) {
        const request = this.pool.request();
        const hash = getHash_1.getHash({ value: consumerId });
        request.input('consumerId', mssql_1.TYPES.NChar, hash);
        await request.query(`
      DELETE FROM [${this.tableNames.progress}]
        WHERE [consumerId] = @consumerId;
    `);
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
        const transaction = this.pool.transaction();
        await transaction.begin();
        try {
            const requestUpdate = transaction.request();
            requestUpdate.input('revision', mssql_1.TYPES.Int, revision);
            requestUpdate.input('consumerId', mssql_1.TYPES.NChar, hash);
            requestUpdate.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
            const { rowsAffected } = await requestUpdate.query(`
        UPDATE [${this.tableNames.progress}]
          SET [revision] = @revision, [isReplayingFrom] = NULL, [isReplayingTo] = NULL
          WHERE [consumerId] = @consumerId AND [aggregateId] = @aggregateId;
      `);
            if (rowsAffected[0] === 1) {
                await transaction.commit();
                return;
            }
            const requestInsert = transaction.request();
            requestInsert.input('consumerId', mssql_1.TYPES.NChar, hash);
            requestInsert.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
            requestInsert.input('revision', mssql_1.TYPES.Int, revision);
            await requestInsert.query(`
        INSERT INTO [${this.tableNames.progress}]
          ([consumerId], [aggregateId], [revision], [isReplayingFrom], [isReplayingTo])
          VALUES (@consumerId, @aggregateId, @revision, NULL, NULL);
      `);
            await transaction.commit();
        }
        catch (ex) {
            await transaction.rollback();
            throw ex;
        }
    }
    async setup() {
        try {
            await this.pool.query(`
        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.progress}')
          BEGIN
            CREATE TABLE [${this.tableNames.progress}] (
              [consumerId] NCHAR(64) NOT NULL,
              [aggregateId] UNIQUEIDENTIFIER NOT NULL,
              [revision] INT NOT NULL,
              [isReplayingFrom] INT,
              [isReplayingTo] INT,

              CONSTRAINT [${this.tableNames.progress}_pk] PRIMARY KEY([consumerId], [aggregateId])
            );
          END
      `);
        }
        catch (ex) {
            if (!/There is already an object named.*_progress/u.test(ex.message)) {
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
exports.SqlServerConsumerProgressStore = SqlServerConsumerProgressStore;
//# sourceMappingURL=SqlServerConsumerProgressStore.js.map