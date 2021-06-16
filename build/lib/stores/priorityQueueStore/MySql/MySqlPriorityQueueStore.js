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
exports.MySqlPriorityQueueStore = void 0;
const createPoolWithDefaults_1 = require("../../utils/mySql/createPoolWithDefaults");
const getIndexOfLeftChild_1 = require("../shared/getIndexOfLeftChild");
const getIndexOfParent_1 = require("../shared/getIndexOfParent");
const getIndexOfRightChild_1 = require("../shared/getIndexOfRightChild");
const p_queue_1 = __importDefault(require("p-queue"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const runQuery_1 = require("../../utils/mySql/runQuery");
const uuid_1 = require("uuid");
const withTransaction_1 = require("../../utils/mySql/withTransaction");
const errors = __importStar(require("../../../common/errors"));
class MySqlPriorityQueueStore {
    constructor({ tableNames, pool, doesIdentifierMatchItem, expirationTime }) {
        this.tableNames = tableNames;
        this.pool = pool;
        this.doesIdentifierMatchItem = doesIdentifierMatchItem;
        this.expirationTime = expirationTime;
        this.functionCallQueue = new p_queue_1.default({ concurrency: 1 });
    }
    static getPriority({ queue }) {
        if (queue.lock && queue.lock.until > Date.now()) {
            return Number.MAX_SAFE_INTEGER;
        }
        return queue.priority;
    }
    static onUnexpectedClose() {
        throw new Error('Connection closed unexpectedly.');
    }
    static releaseConnection({ connection }) {
        connection.removeListener('end', MySqlPriorityQueueStore.onUnexpectedClose);
        connection.release();
    }
    async getDatabase() {
        const database = await retry_ignore_abort_1.retry(async () => new Promise((resolve, reject) => {
            this.pool.getConnection((err, poolConnection) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(poolConnection);
            });
        }));
        return database;
    }
    static async create({ doesIdentifierMatchItem, expirationTime = 15000, hostName, port, userName, password, database, tableNames }) {
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
            connection.on('end', MySqlPriorityQueueStore.onUnexpectedClose);
        });
        return new MySqlPriorityQueueStore({
            tableNames,
            pool,
            doesIdentifierMatchItem,
            expirationTime
        });
    }
    async swapPositionsInPriorityQueue({ connection, firstQueue, secondQueue }) {
        await runQuery_1.runQuery({
            connection,
            query: `
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET indexInPriorityQueue = -1
          WHERE discriminator = ?;
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET indexInPriorityQueue = ?
          WHERE discriminator = ?;
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET indexInPriorityQueue = ?
          WHERE discriminator = ?;
      `,
            parameters: [firstQueue.discriminator, firstQueue.index, secondQueue.discriminator, secondQueue.index, firstQueue.discriminator]
        });
    }
    async repairUp({ connection, discriminator }) {
        const queue = await this.getQueueByDiscriminator({ connection, discriminator });
        if (!queue) {
            throw new errors.InvalidOperation();
        }
        if (queue.index === 0) {
            return;
        }
        const parentIndex = getIndexOfParent_1.getIndexOfParent({ index: queue.index });
        const parentQueue = (await this.getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue: parentIndex }));
        const queuePriority = MySqlPriorityQueueStore.getPriority({ queue });
        const parentQueuePriority = MySqlPriorityQueueStore.getPriority({ queue: parentQueue });
        if (parentQueuePriority <= queuePriority) {
            return;
        }
        await this.swapPositionsInPriorityQueue({
            connection,
            firstQueue: queue,
            secondQueue: parentQueue
        });
        await this.repairUp({ connection, discriminator: queue.discriminator });
    }
    async repairDown({ connection, discriminator }) {
        const queue = await this.getQueueByDiscriminator({ connection, discriminator });
        if (!queue) {
            throw new errors.InvalidOperation();
        }
        const leftChildIndex = getIndexOfLeftChild_1.getIndexOfLeftChild({ index: queue.index });
        const rightChildIndex = getIndexOfRightChild_1.getIndexOfRightChild({ index: queue.index });
        const leftChildQueue = await this.getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue: leftChildIndex });
        if (!leftChildQueue) {
            // If no left child is found, there is no layer beneath the current queue
            // and we can stop here.
            return;
        }
        const rightChildQueue = await this.getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue: rightChildIndex });
        const queuePriority = MySqlPriorityQueueStore.getPriority({ queue });
        const leftChildQueuePriority = MySqlPriorityQueueStore.getPriority({ queue: leftChildQueue });
        const rightChildQueuePriority = rightChildQueue ?
            MySqlPriorityQueueStore.getPriority({ queue: rightChildQueue }) :
            Number.MAX_SAFE_INTEGER;
        if (queuePriority <= leftChildQueuePriority &&
            queuePriority <= rightChildQueuePriority) {
            return;
        }
        if (leftChildQueuePriority <= rightChildQueuePriority) {
            await this.swapPositionsInPriorityQueue({
                connection,
                firstQueue: queue,
                secondQueue: leftChildQueue
            });
            await this.repairDown({ connection, discriminator: queue.discriminator });
        }
        else {
            await this.swapPositionsInPriorityQueue({
                connection,
                firstQueue: queue,
                secondQueue: rightChildQueue
            });
            await this.repairDown({ connection, discriminator: queue.discriminator });
        }
    }
    async removeQueueInternal({ connection, discriminator }) {
        const [rows] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT indexInPriorityQueue FROM \`${this.tableNames.priorityQueue}\`
          WHERE discriminator = ?;
      `,
            parameters: [discriminator]
        });
        if (rows.length === 0) {
            throw new errors.InvalidOperation();
        }
        await runQuery_1.runQuery({
            connection,
            query: `
        DELETE FROM \`${this.tableNames.priorityQueue}\`
          WHERE discriminator = ?;
      `,
            parameters: [discriminator, rows[0].indexInPriorityQueue, rows[0].indexInPriorityQueue]
        });
        const [[{ count }]] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT count(*) as count
          FROM \`${this.tableNames.priorityQueue}\`
      `
        });
        if (rows[0].indexInPriorityQueue >= count) {
            return;
        }
        await runQuery_1.runQuery({
            connection,
            query: `
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET indexInPriorityQueue = ?
          WHERE indexInPriorityQueue = ?;
      `,
            parameters: [rows[0].indexInPriorityQueue, count]
        });
        const [[{ discriminator: movedQueueDiscriminator }]] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT discriminator
          FROM \`${this.tableNames.priorityQueue}\`
          WHERE indexInPriorityQueue = ?;
      `,
            parameters: [rows[0].indexInPriorityQueue]
        });
        await this.repairDown({ connection, discriminator: movedQueueDiscriminator });
    }
    async getQueueByDiscriminator({ connection, discriminator }) {
        const [rows] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT
            pq.indexInPriorityQueue AS indexInPriorityQueue,
            i.priority AS priority,
            pq.lockUntil AS lockUntil,
            CASE WHEN pq.lockToken IS NULL THEN NULL ELSE UuidFromBin(pq.lockToken) END AS lockToken
          FROM \`${this.tableNames.priorityQueue}\` AS pq
          JOIN \`${this.tableNames.items}\` AS i
            ON pq.discriminator = i.discriminator
          WHERE pq.discriminator = ? AND i.indexInQueue = 0;
      `,
            parameters: [discriminator]
        });
        if (rows.length === 0) {
            return;
        }
        const queue = {
            discriminator,
            index: rows[0].indexInPriorityQueue,
            priority: rows[0].priority
        };
        if (rows[0].lockUntil) {
            queue.lock = {
                until: rows[0].lockUntil,
                token: rows[0].lockToken.toString()
            };
        }
        return queue;
    }
    async getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue }) {
        const [rows] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT
            pq.discriminator AS discriminator,
            i.priority AS priority,
            pq.lockUntil AS lockUntil,
            CASE WHEN pq.lockToken IS NULL THEN NULL ELSE UuidFromBin(pq.lockToken) END AS lockToken
          FROM \`${this.tableNames.priorityQueue}\` AS pq
          JOIN \`${this.tableNames.items}\` AS i
            ON pq.discriminator = i.discriminator
          WHERE pq.indexInPriorityQueue = ? AND i.indexInQueue = 0;
      `,
            parameters: [indexInPriorityQueue]
        });
        if (rows.length === 0) {
            return;
        }
        const queue = {
            discriminator: rows[0].discriminator,
            index: indexInPriorityQueue,
            priority: rows[0].priority
        };
        if (rows[0].lockUntil) {
            queue.lock = {
                until: rows[0].lockUntil,
                token: rows[0].lockToken.toString()
            };
        }
        return queue;
    }
    async getFirstItemInQueue({ connection, discriminator }) {
        const [[{ item }]] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT item FROM \`${this.tableNames.items}\`
          WHERE discriminator = ?
          ORDER BY indexInQueue ASC
          LIMIT 1
      `,
            parameters: [discriminator]
        });
        if (!item) {
            throw new errors.InvalidOperation();
        }
        return JSON.parse(item);
    }
    async getQueueIfLocked({ connection, discriminator, token }) {
        const queue = await this.getQueueByDiscriminator({ connection, discriminator });
        if (!queue) {
            throw new errors.ItemNotFound(`Item for discriminator '${discriminator}' not found.`);
        }
        if (!queue.lock) {
            throw new errors.ItemNotLocked(`Item for discriminator '${discriminator}' not locked.`);
        }
        if (queue.lock.token !== token) {
            throw new errors.TokenMismatch(`Token mismatch for discriminator '${discriminator}'.`);
        }
        return queue;
    }
    async enqueueInternal({ connection, item, discriminator, priority }) {
        var _a;
        const [[{ nextIndexInQueue }]] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT COALESCE(MAX(indexInQueue) + 1, 0) as nextIndexInQueue
          FROM \`${this.tableNames.items}\`
          WHERE discriminator = ?;
      `,
            parameters: [discriminator]
        });
        await runQuery_1.runQuery({
            connection,
            query: `
        INSERT INTO \`${this.tableNames.items}\` (discriminator, indexInQueue, priority, item)
          VALUES (?, ?, ?, ?);
      `,
            parameters: [discriminator, nextIndexInQueue, priority, JSON.stringify(item)]
        });
        try {
            const [[{ nextIndexInPriorityQueue }]] = await runQuery_1.runQuery({
                connection,
                query: `
          SELECT COALESCE(MAX(indexInPriorityQueue) + 1, 0) as nextIndexInPriorityQueue
            FROM \`${this.tableNames.priorityQueue}\`;
        `
            });
            await runQuery_1.runQuery({
                connection,
                query: `
          INSERT INTO \`${this.tableNames.priorityQueue}\` (discriminator, indexInPriorityQueue)
            VALUES (?, ?);
        `,
                parameters: [discriminator, nextIndexInPriorityQueue]
            });
        }
        catch (ex) {
            if (ex.code === 'ER_DUP_ENTRY' &&
                ((_a = ex.sqlMessage) === null || _a === void 0 ? void 0 : _a.endsWith('for key \'PRIMARY\''))) {
                return;
            }
            throw ex;
        }
        await this.repairUp({ connection, discriminator });
    }
    async enqueue({ item, discriminator, priority }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                getConnection: async () => await this.getDatabase(),
                fn: async ({ connection }) => {
                    await this.enqueueInternal({ connection, item, discriminator, priority });
                },
                async releaseConnection({ connection }) {
                    MySqlPriorityQueueStore.releaseConnection({ connection });
                }
            });
        });
    }
    async lockNextInternal({ connection }) {
        const [rows] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT discriminator FROM \`${this.tableNames.priorityQueue}\`
          WHERE lockUntil IS NULL OR lockUntil <= ?
          ORDER BY indexInPriorityQueue ASC
          LIMIT 1
      `,
            parameters: [Date.now()]
        });
        if (rows.length === 0) {
            return;
        }
        const { discriminator } = rows[0];
        const item = await this.getFirstItemInQueue({ connection, discriminator });
        const until = Date.now() + this.expirationTime;
        const token = uuid_1.v4();
        await runQuery_1.runQuery({
            connection,
            query: `
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET lockUntil = ?, lockToken = UuidToBin(?)
          WHERE discriminator = ?
      `,
            parameters: [until, token, discriminator]
        });
        await this.repairDown({ connection, discriminator });
        return { item, metadata: { discriminator, token } };
    }
    async lockNext() {
        return await this.functionCallQueue.add(async () => await withTransaction_1.withTransaction({
            getConnection: async () => await this.getDatabase(),
            fn: async ({ connection }) => await this.lockNextInternal({ connection }),
            async releaseConnection({ connection }) {
                MySqlPriorityQueueStore.releaseConnection({ connection });
            }
        }));
    }
    async renewLockInternal({ connection, discriminator, token }) {
        const queue = await this.getQueueIfLocked({ connection, discriminator, token });
        const newUntil = Date.now() + this.expirationTime;
        await runQuery_1.runQuery({
            connection,
            query: `
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET lockUntil = ?
          WHERE discriminator = ?;
      `,
            parameters: [newUntil, queue.discriminator]
        });
        await this.repairDown({ connection, discriminator: queue.discriminator });
    }
    async renewLock({ discriminator, token }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                getConnection: async () => await this.getDatabase(),
                fn: async ({ connection }) => {
                    await this.renewLockInternal({ connection, discriminator, token });
                },
                async releaseConnection({ connection }) {
                    MySqlPriorityQueueStore.releaseConnection({ connection });
                }
            });
        });
    }
    async acknowledgeInternal({ connection, discriminator, token }) {
        const queue = await this.getQueueIfLocked({ connection, discriminator, token });
        const [results] = await runQuery_1.runQuery({
            connection,
            query: `
        DELETE FROM \`${this.tableNames.items}\`
          WHERE discriminator = ? AND indexInQueue = 0;
        UPDATE \`${this.tableNames.items}\`
          SET indexInQueue = indexInQueue - 1
          WHERE discriminator = ?
          ORDER BY indexInQueue ASC;
      `,
            parameters: [queue.discriminator, queue.discriminator]
        });
        if (results[1].changedRows > 0) {
            // If the indexes of any item were changed, i.e. if there are still items in the queue...
            await runQuery_1.runQuery({
                connection,
                query: `
          UPDATE \`${this.tableNames.priorityQueue}\`
            SET lockUntil = NULL, lockToken = NULL
            WHERE discriminator = ?;
        `,
                parameters: [queue.discriminator]
            });
            await this.repairDown({ connection, discriminator: queue.discriminator });
            return;
        }
        await this.removeQueueInternal({ connection, discriminator: queue.discriminator });
    }
    async acknowledge({ discriminator, token }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                getConnection: async () => await this.getDatabase(),
                fn: async ({ connection }) => {
                    await this.acknowledgeInternal({ connection, discriminator, token });
                },
                async releaseConnection({ connection }) {
                    MySqlPriorityQueueStore.releaseConnection({ connection });
                }
            });
        });
    }
    async deferInternal({ connection, discriminator, token, priority }) {
        const queue = await this.getQueueIfLocked({ connection, discriminator, token });
        const item = await this.getFirstItemInQueue({ connection, discriminator: queue.discriminator });
        await this.acknowledgeInternal({ connection, discriminator: queue.discriminator, token });
        await this.enqueueInternal({ connection, item, discriminator: queue.discriminator, priority });
    }
    async defer({ discriminator, token, priority }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                getConnection: async () => await this.getDatabase(),
                fn: async ({ connection }) => {
                    await this.deferInternal({ connection, discriminator, token, priority });
                },
                async releaseConnection({ connection }) {
                    MySqlPriorityQueueStore.releaseConnection({ connection });
                }
            });
        });
    }
    async removeInternal({ connection, discriminator, itemIdentifier }) {
        const queue = await this.getQueueByDiscriminator({ connection, discriminator });
        if (!queue) {
            throw new errors.ItemNotFound();
        }
        const [results] = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT item FROM \`${this.tableNames.items}\`
          WHERE discriminator = ?
          ORDER BY indexInQueue ASC;
      `,
            parameters: [queue.discriminator]
        });
        const items = results.map(({ item }) => JSON.parse(item));
        const foundItemIndex = items.findIndex((item) => this.doesIdentifierMatchItem({ item, itemIdentifier }));
        if (foundItemIndex === -1) {
            throw new errors.ItemNotFound();
        }
        if (foundItemIndex === 0) {
            if (queue.lock && queue.lock.until > Date.now()) {
                throw new errors.ItemNotFound();
            }
            if (items.length === 1) {
                await this.removeQueueInternal({ connection, discriminator });
                return;
            }
            await runQuery_1.runQuery({
                connection,
                query: `
          DELETE FROM \`${this.tableNames.items}\`
            WHERE discriminator = ? AND indexInQueue = 0;
          UPDATE \`${this.tableNames.items}\`
            SET indexInQueue = indexInQueue - 1
            WHERE discriminator = ?
            ORDER BY indexInQueue ASC;
        `,
                parameters: [queue.discriminator, queue.discriminator]
            });
            await this.repairDown({ connection, discriminator: queue.discriminator });
            await this.repairUp({ connection, discriminator: queue.discriminator });
            return;
        }
        await runQuery_1.runQuery({
            connection,
            query: `
          DELETE FROM \`${this.tableNames.items}\`
            WHERE discriminator = ? AND indexInQueue = ?;
          UPDATE \`${this.tableNames.items}\`
            SET indexInQueue = indexInQueue - 1
            WHERE discriminator = ? AND indexInQueue > ?
            ORDER BY indexInQueue ASC;
        `,
            parameters: [queue.discriminator, foundItemIndex, queue.discriminator, foundItemIndex]
        });
    }
    async remove({ discriminator, itemIdentifier }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                getConnection: async () => await this.getDatabase(),
                fn: async ({ connection }) => {
                    await this.removeInternal({ connection, discriminator, itemIdentifier });
                },
                async releaseConnection({ connection }) {
                    MySqlPriorityQueueStore.releaseConnection({ connection });
                }
            });
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
        const query = `
      CREATE TABLE IF NOT EXISTS \`${this.tableNames.items}\`
      (
        discriminator VARCHAR(100) NOT NULL,
        indexInQueue INT NOT NULL,
        priority BIGINT NOT NULL,
        item JSON NOT NULL,

        PRIMARY KEY (discriminator, indexInQueue),
        INDEX (discriminator)
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`${this.tableNames.priorityQueue}\`
      (
        discriminator VARCHAR(100) NOT NULL,
        indexInPriorityQueue INT NOT NULL,
        lockUntil BIGINT,
        lockToken BINARY(16),

        PRIMARY KEY (discriminator),
        UNIQUE INDEX (indexInPriorityQueue)
      ) ENGINE=InnoDB;
    `;
        await runQuery_1.runQuery({ connection, query });
        MySqlPriorityQueueStore.releaseConnection({ connection });
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
exports.MySqlPriorityQueueStore = MySqlPriorityQueueStore;
//# sourceMappingURL=MySqlPriorityQueueStore.js.map