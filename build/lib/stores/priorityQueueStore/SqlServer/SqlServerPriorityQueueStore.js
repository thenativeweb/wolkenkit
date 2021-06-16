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
exports.SqlServerPriorityQueueStore = void 0;
const getIndexOfLeftChild_1 = require("../shared/getIndexOfLeftChild");
const getIndexOfParent_1 = require("../shared/getIndexOfParent");
const getIndexOfRightChild_1 = require("../shared/getIndexOfRightChild");
const p_queue_1 = __importDefault(require("p-queue"));
const uuid_1 = require("uuid");
const mssql_1 = require("mssql");
const errors = __importStar(require("../../../common/errors"));
class SqlServerPriorityQueueStore {
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
    static async create({ doesIdentifierMatchItem, expirationTime = 15000, hostName, port, userName, password, database, tableNames, encryptConnection = false }) {
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
            SqlServerPriorityQueueStore.onUnexpectedClose();
        });
        await pool.connect();
        return new SqlServerPriorityQueueStore({
            tableNames,
            pool,
            doesIdentifierMatchItem,
            expirationTime
        });
    }
    async swapPositionsInPriorityQueue({ transaction, firstQueue, secondQueue }) {
        const request = transaction.request();
        request.input('firstDiscriminator', mssql_1.TYPES.NVarChar, firstQueue.discriminator);
        request.input('firstIndex', mssql_1.TYPES.Int, firstQueue.index);
        request.input('secondDiscriminator', mssql_1.TYPES.NVarChar, secondQueue.discriminator);
        request.input('secondIndex', mssql_1.TYPES.Int, secondQueue.index);
        await request.query(`
      UPDATE [${this.tableNames.priorityQueue}]
        SET [indexInPriorityQueue] = -1
        WHERE [discriminator] = @firstDiscriminator;
      UPDATE [${this.tableNames.priorityQueue}]
        SET [indexInPriorityQueue] = @firstIndex
        WHERE [discriminator] = @secondDiscriminator;
      UPDATE [${this.tableNames.priorityQueue}]
        SET [indexInPriorityQueue] = @secondIndex
        WHERE [discriminator] = @firstDiscriminator;
    `);
    }
    async repairUp({ transaction, discriminator }) {
        const queue = await this.getQueueByDiscriminator({ transaction, discriminator });
        if (!queue) {
            throw new errors.InvalidOperation();
        }
        if (queue.index === 0) {
            return;
        }
        const parentIndex = getIndexOfParent_1.getIndexOfParent({ index: queue.index });
        const parentQueue = (await this.getQueueByIndexInPriorityQueue({ transaction, indexInPriorityQueue: parentIndex }));
        const queuePriority = SqlServerPriorityQueueStore.getPriority({ queue });
        const parentQueuePriority = SqlServerPriorityQueueStore.getPriority({ queue: parentQueue });
        if (parentQueuePriority <= queuePriority) {
            return;
        }
        await this.swapPositionsInPriorityQueue({
            transaction,
            firstQueue: queue,
            secondQueue: parentQueue
        });
        await this.repairUp({ transaction, discriminator: queue.discriminator });
    }
    async repairDown({ transaction, discriminator }) {
        const queue = await this.getQueueByDiscriminator({ transaction, discriminator });
        if (!queue) {
            throw new errors.InvalidOperation();
        }
        const leftChildIndex = getIndexOfLeftChild_1.getIndexOfLeftChild({ index: queue.index });
        const rightChildIndex = getIndexOfRightChild_1.getIndexOfRightChild({ index: queue.index });
        const leftChildQueue = await this.getQueueByIndexInPriorityQueue({ transaction, indexInPriorityQueue: leftChildIndex });
        if (!leftChildQueue) {
            // If no left child is found, there is no layer beneath the current queue
            // and we can stop here.
            return;
        }
        const rightChildQueue = await this.getQueueByIndexInPriorityQueue({ transaction, indexInPriorityQueue: rightChildIndex });
        const queuePriority = SqlServerPriorityQueueStore.getPriority({ queue });
        const leftChildQueuePriority = SqlServerPriorityQueueStore.getPriority({ queue: leftChildQueue });
        const rightChildQueuePriority = rightChildQueue ?
            SqlServerPriorityQueueStore.getPriority({ queue: rightChildQueue }) :
            Number.MAX_SAFE_INTEGER;
        if (queuePriority <= leftChildQueuePriority &&
            queuePriority <= rightChildQueuePriority) {
            return;
        }
        if (leftChildQueuePriority <= rightChildQueuePriority) {
            await this.swapPositionsInPriorityQueue({
                transaction,
                firstQueue: queue,
                secondQueue: leftChildQueue
            });
            await this.repairDown({ transaction, discriminator: queue.discriminator });
        }
        else {
            await this.swapPositionsInPriorityQueue({
                transaction,
                firstQueue: queue,
                secondQueue: rightChildQueue
            });
            await this.repairDown({ transaction, discriminator: queue.discriminator });
        }
    }
    async removeQueueInternal({ transaction, discriminator }) {
        const requestOne = transaction.request();
        requestOne.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        const { recordset } = await requestOne.query(`
      SELECT [indexInPriorityQueue]
        FROM [${this.tableNames.priorityQueue}]
        WHERE [discriminator] = @discriminator;
    `);
        if (recordset.length === 0) {
            throw new errors.ItemNotFound();
        }
        const requestTwo = transaction.request();
        requestTwo.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        await requestTwo.query(`
      DELETE
        FROM [${this.tableNames.priorityQueue}]
        WHERE [discriminator] = @discriminator;
    `);
        const requestThree = transaction.request();
        const { recordset: [{ count }] } = await requestThree.query(`
      SELECT count(*) as count
        FROM [${this.tableNames.priorityQueue}];
    `);
        if (recordset[0].indexInPriorityQueue >= count) {
            return;
        }
        const requestFour = transaction.request();
        requestFour.input('index', mssql_1.TYPES.Int, recordset[0].indexInPriorityQueue);
        requestFour.input('lastIndex', mssql_1.TYPES.Int, count);
        await requestFour.query(`
      UPDATE [${this.tableNames.priorityQueue}]
        SET [indexInPriorityQueue] = @index
        WHERE [indexInPriorityQueue] = @lastIndex;
    `);
        const requestFive = transaction.request();
        requestFive.input('index', mssql_1.TYPES.Int, recordset[0].indexInPriorityQueue);
        const { recordset: [{ discriminator: movedQueueDiscriminator }] } = await requestFive.query(`
      SELECT [discriminator]
        FROM [${this.tableNames.priorityQueue}]
        WHERE [indexInPriorityQueue] = @index;
    `);
        await this.repairDown({ transaction, discriminator: movedQueueDiscriminator });
    }
    async getQueueByDiscriminator({ transaction, discriminator }) {
        const request = transaction.request();
        request.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        const { recordset } = await request.query(`
      SELECT
          [pq].[indexInPriorityQueue] AS [indexInPriorityQueue],
          [i].[priority] AS [priority],
          [pq].[lockUntil] AS [lockUntil],
          CASE WHEN [pq].[lockToken] IS NULL THEN NULL ELSE [pq].[lockToken] END AS [lockToken]
        FROM [${this.tableNames.priorityQueue}] AS [pq]
        JOIN [${this.tableNames.items}] AS [i]
          ON [pq].[discriminator] = [i].[discriminator]
        WHERE [pq].[discriminator] = @discriminator
          AND [i].[indexInQueue] = 0;
    `);
        if (recordset.length === 0) {
            return;
        }
        const queue = {
            discriminator,
            index: recordset[0].indexInPriorityQueue,
            priority: recordset[0].priority
        };
        if (recordset[0].lockUntil) {
            queue.lock = {
                until: recordset[0].lockUntil,
                token: recordset[0].lockToken.toLowerCase()
            };
        }
        return queue;
    }
    async getQueueByIndexInPriorityQueue({ transaction, indexInPriorityQueue }) {
        const request = transaction.request();
        request.input('indexInPriorityQueue', mssql_1.TYPES.Int, indexInPriorityQueue);
        const { recordset } = await request.query(`
      SELECT
          [pq].[discriminator] AS [discriminator],
          [i].[priority] AS [priority],
          [pq].[lockUntil] AS [lockUntil],
          CASE WHEN [pq].[lockToken] IS NULL THEN NULL ELSE [pq].[lockToken] END AS [lockToken]
        FROM [${this.tableNames.priorityQueue}] AS [pq]
        JOIN [${this.tableNames.items}] AS [i]
          ON [pq].[discriminator] = [i].[discriminator]
        WHERE [pq].[indexInPriorityQueue] = @indexInPriorityQueue
          AND [i].[indexInQueue] = 0;
    `);
        if (recordset.length === 0) {
            return;
        }
        const queue = {
            discriminator: recordset[0].discriminator,
            index: indexInPriorityQueue,
            priority: recordset[0].priority
        };
        if (recordset[0].lockUntil) {
            queue.lock = {
                until: recordset[0].lockUntil,
                token: recordset[0].lockToken.toLowerCase()
            };
        }
        return queue;
    }
    async getFirstItemInQueue({ transaction, discriminator }) {
        const request = transaction.request();
        request.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        const { recordset } = await request.query(`
      SELECT TOP 1 [item]
        FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator
        ORDER BY [indexInQueue] ASC;
    `);
        if (recordset.length === 0) {
            throw new errors.InvalidOperation();
        }
        return JSON.parse(recordset[0].item);
    }
    async getQueueIfLocked({ transaction, discriminator, token }) {
        const queue = await this.getQueueByDiscriminator({ transaction, discriminator });
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
    async enqueueInternal({ transaction, item, discriminator, priority }) {
        const requestGetNextIndexInQueue = transaction.request();
        requestGetNextIndexInQueue.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        const { recordset: [{ nextIndexInQueue }] } = await requestGetNextIndexInQueue.query(`
      SELECT COALESCE(MAX([indexInQueue]) + 1, 0) AS [nextIndexInQueue]
        FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator;
    `);
        const requestInsertItem = transaction.request();
        requestInsertItem.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        requestInsertItem.input('indexInQueue', mssql_1.TYPES.Int, nextIndexInQueue);
        requestInsertItem.input('priority', mssql_1.TYPES.BigInt, priority);
        requestInsertItem.input('item', mssql_1.TYPES.NVarChar, JSON.stringify(item));
        await requestInsertItem.query(`
      INSERT
        INTO [${this.tableNames.items}] ([discriminator], [indexInQueue], [priority], [item])
        VALUES (@discriminator, @indexInQueue, @priority, @item);
    `);
        try {
            const requestGetNextIndexInPriorityQueue = transaction.request();
            const { recordset: [{ nextIndexInPriorityQueue }] } = await requestGetNextIndexInPriorityQueue.query(`
        SELECT COALESCE(MAX([indexInPriorityQueue]) + 1, 0) AS [nextIndexInPriorityQueue]
          FROM [${this.tableNames.priorityQueue}];
      `);
            const requestInsertPriorityQueue = transaction.request();
            requestInsertPriorityQueue.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
            requestInsertPriorityQueue.input('indexInPriorityQueue', mssql_1.TYPES.Int, nextIndexInPriorityQueue);
            await requestInsertPriorityQueue.query(`
        INSERT
          INTO [${this.tableNames.priorityQueue}] ([discriminator], [indexInPriorityQueue])
          VALUES (@discriminator, @indexInPriorityQueue);
      `);
        }
        catch (ex) {
            if (ex instanceof mssql_1.RequestError &&
                ex.code === 'EREQUEST' &&
                ex.number === 2627 &&
                ex.message.startsWith('Violation of PRIMARY KEY constraint')) {
                return;
            }
            throw ex;
        }
        await this.repairUp({ transaction, discriminator });
    }
    async enqueue({ item, discriminator, priority }) {
        await this.functionCallQueue.add(async () => {
            const transaction = this.pool.transaction();
            await transaction.begin();
            try {
                await this.enqueueInternal({ transaction, item, discriminator, priority });
                await transaction.commit();
            }
            catch (ex) {
                await transaction.rollback();
                throw ex;
            }
        });
    }
    async lockNextInternal({ transaction }) {
        const requestSelect = transaction.request();
        requestSelect.input('now', mssql_1.TYPES.BigInt, Date.now());
        const { recordset } = await requestSelect.query(`
      SELECT TOP 1 [discriminator] FROM [${this.tableNames.priorityQueue}]
        WHERE [lockUntil] IS NULL
           OR [lockUntil] <= @now
        ORDER BY [indexInPriorityQueue] ASC;
    `);
        if (recordset.length === 0) {
            return;
        }
        const { discriminator } = recordset[0];
        const item = await this.getFirstItemInQueue({ transaction, discriminator });
        const until = Date.now() + this.expirationTime;
        const token = uuid_1.v4();
        const requestUpdate = transaction.request();
        requestUpdate.input('until', mssql_1.TYPES.BigInt, until);
        requestUpdate.input('token', mssql_1.TYPES.UniqueIdentifier, token);
        requestUpdate.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        await requestUpdate.query(`
      UPDATE [${this.tableNames.priorityQueue}]
        SET [lockUntil] = @until, [lockToken] = @token
        WHERE [discriminator] = @discriminator
    `);
        await this.repairDown({ transaction, discriminator });
        return { item, metadata: { discriminator, token } };
    }
    async lockNext() {
        return await this.functionCallQueue.add(async () => {
            const transaction = this.pool.transaction();
            let nextItem;
            await transaction.begin();
            try {
                nextItem = await this.lockNextInternal({ transaction });
                await transaction.commit();
            }
            catch (ex) {
                await transaction.rollback();
                throw ex;
            }
            return nextItem;
        });
    }
    async renewLockInternal({ transaction, discriminator, token }) {
        const queue = await this.getQueueIfLocked({ transaction, discriminator, token });
        const newUntil = Date.now() + this.expirationTime;
        const request = transaction.request();
        request.input('newUntil', mssql_1.TYPES.BigInt, newUntil);
        request.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        await request.query(`
      UPDATE [${this.tableNames.priorityQueue}]
        SET [lockUntil] = @newUntil
        WHERE [discriminator] = @discriminator;
    `);
        await this.repairDown({ transaction, discriminator: queue.discriminator });
    }
    async renewLock({ discriminator, token }) {
        await this.functionCallQueue.add(async () => {
            const transaction = this.pool.transaction();
            await transaction.begin();
            try {
                await this.renewLockInternal({ transaction, discriminator, token });
                await transaction.commit();
            }
            catch (ex) {
                await transaction.rollback();
                throw ex;
            }
        });
    }
    async acknowledgeInternal({ transaction, discriminator, token }) {
        const queue = await this.getQueueIfLocked({ transaction, discriminator, token });
        const requestDelete = transaction.request();
        requestDelete.input('discriminator', mssql_1.TYPES.NVarChar, queue.discriminator);
        const { rowsAffected } = await requestDelete.query(`
      DELETE FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator
          AND [indexInQueue] = 0;
      UPDATE [${this.tableNames.items}]
        SET [indexInQueue] = [indexInQueue] - 1
        WHERE [discriminator] = @discriminator;
    `);
        if (rowsAffected[1] > 0) {
            // If the indexes of any item were changed, i.e. if there are still items
            // in the queue...
            const requestUpdate = transaction.request();
            requestUpdate.input('discriminator', mssql_1.TYPES.NVarChar, queue.discriminator);
            await requestUpdate.query(`
        UPDATE [${this.tableNames.priorityQueue}]
          SET [lockUntil] = NULL, [lockToken] = NULL
          WHERE [discriminator] = @discriminator;
      `);
            await this.repairDown({ transaction, discriminator: queue.discriminator });
            return;
        }
        await this.removeQueueInternal({ transaction, discriminator: queue.discriminator });
    }
    async acknowledge({ discriminator, token }) {
        await this.functionCallQueue.add(async () => {
            const transaction = this.pool.transaction();
            await transaction.begin();
            try {
                await this.acknowledgeInternal({ transaction, discriminator, token });
                await transaction.commit();
            }
            catch (ex) {
                await transaction.rollback();
                throw ex;
            }
        });
    }
    async deferInternal({ transaction, discriminator, token, priority }) {
        const queue = await this.getQueueIfLocked({ transaction, discriminator, token });
        const item = await this.getFirstItemInQueue({ transaction, discriminator: queue.discriminator });
        await this.acknowledgeInternal({ transaction, discriminator: queue.discriminator, token });
        await this.enqueueInternal({ transaction, item, discriminator: queue.discriminator, priority });
    }
    async defer({ discriminator, token, priority }) {
        await this.functionCallQueue.add(async () => {
            const transaction = this.pool.transaction();
            await transaction.begin();
            try {
                await this.deferInternal({ transaction, discriminator, token, priority });
                await transaction.commit();
            }
            catch (ex) {
                await transaction.rollback();
                throw ex;
            }
        });
    }
    async removeInternal({ transaction, discriminator, itemIdentifier }) {
        const queue = await this.getQueueByDiscriminator({ transaction, discriminator });
        if (!queue) {
            throw new errors.ItemNotFound();
        }
        const getItemsRequest = transaction.request();
        getItemsRequest.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        const { recordset } = await getItemsRequest.query(`
      SELECT [item]
        FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator
        ORDER BY [indexInQueue] ASC;
    `);
        const items = recordset.map(({ item }) => JSON.parse(item));
        const foundItemIndex = items.findIndex((item) => this.doesIdentifierMatchItem({ item, itemIdentifier }));
        if (foundItemIndex === -1) {
            throw new errors.ItemNotFound();
        }
        if (foundItemIndex === 0) {
            if (queue.lock && queue.lock.until > Date.now()) {
                throw new errors.ItemNotFound();
            }
            if (items.length === 1) {
                await this.removeQueueInternal({ transaction, discriminator });
                return;
            }
            const removeItemRequest = transaction.request();
            removeItemRequest.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
            await removeItemRequest.query(`
        DELETE
          FROM [${this.tableNames.items}]
          WHERE [discriminator] = @discriminator
            AND [indexInQueue] = 0;
        UPDATE [${this.tableNames.items}]
          SET [indexInQueue] = [indexInQueue] - 1
          WHERE [discriminator] = @discriminator;
      `);
            await this.repairDown({ transaction, discriminator: queue.discriminator });
            await this.repairUp({ transaction, discriminator: queue.discriminator });
            return;
        }
        const removeItemRequest = transaction.request();
        removeItemRequest.input('discriminator', mssql_1.TYPES.NVarChar, discriminator);
        removeItemRequest.input('indexInQueue', mssql_1.TYPES.Int, foundItemIndex);
        await removeItemRequest.query(`
      DELETE
        FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator
          AND [indexInQueue] = @indexInQueue;
      UPDATE [${this.tableNames.items}]
        SET [indexInQueue] = [indexInQueue] - 1
        WHERE [discriminator] = @discriminator
          AND [indexInQueue] > @indexInQueue;
    `);
    }
    async remove({ discriminator, itemIdentifier }) {
        await this.functionCallQueue.add(async () => {
            const transaction = this.pool.transaction();
            await transaction.begin();
            try {
                await this.removeInternal({ transaction, discriminator, itemIdentifier });
                await transaction.commit();
            }
            catch (ex) {
                await transaction.rollback();
                throw ex;
            }
        });
    }
    async setup() {
        try {
            await this.pool.query(`
        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.items}')
          BEGIN
            CREATE TABLE [${this.tableNames.items}] (
              [discriminator] NVARCHAR(100) NOT NULL,
              [indexInQueue] INT NOT NULL,
              [priority] BIGINT NOT NULL,
              [item] NVARCHAR(4000) NOT NULL,

              CONSTRAINT [${this.tableNames.items}_pk] PRIMARY KEY([discriminator], [indexInQueue])
            );

            CREATE INDEX [${this.tableNames.items}_idx_discriminator]
              ON [${this.tableNames.items}] ([discriminator]);
          END

        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.priorityQueue}')
          BEGIN
            CREATE TABLE [${this.tableNames.priorityQueue}] (
              [discriminator] NVARCHAR(100) NOT NULL,
              [indexInPriorityQueue] INT NOT NULL,
              [lockUntil] BIGINT,
              [lockToken] UNIQUEIDENTIFIER,

              CONSTRAINT [${this.tableNames.priorityQueue}_pk] PRIMARY KEY([discriminator])
            );

            CREATE UNIQUE INDEX [${this.tableNames.priorityQueue}_idx_indexInPriorityQueue]
              ON [${this.tableNames.priorityQueue}] ([indexInPriorityQueue]);
          END
      `);
        }
        catch (ex) {
            if (!ex.message.includes('There is already an object named')) {
                throw ex;
            }
            // When multiple clients initialize at the same time, e.g. during
            // integration tests, SQL Server might throw an error. In this case we
            // simply ignore it
        }
    }
    async destroy() {
        await this.pool.close();
    }
}
exports.SqlServerPriorityQueueStore = SqlServerPriorityQueueStore;
//# sourceMappingURL=SqlServerPriorityQueueStore.js.map