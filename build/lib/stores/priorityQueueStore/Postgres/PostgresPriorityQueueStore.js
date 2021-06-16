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
exports.PostgresPriorityQueueStore = void 0;
const getIndexOfLeftChild_1 = require("../shared/getIndexOfLeftChild");
const getIndexOfParent_1 = require("../shared/getIndexOfParent");
const getIndexOfRightChild_1 = require("../shared/getIndexOfRightChild");
const p_queue_1 = __importDefault(require("p-queue"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const uuid_1 = require("uuid");
const withTransaction_1 = require("../../utils/postgres/withTransaction");
const pg_1 = require("pg");
const errors = __importStar(require("../../../common/errors"));
class PostgresPriorityQueueStore {
    constructor({ tableNames, pool, disconnectWatcher, doesIdentifierMatchItem, expirationTime }) {
        this.tableNames = tableNames;
        this.pool = pool;
        this.disconnectWatcher = disconnectWatcher;
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
    async getDatabase() {
        const database = await retry_ignore_abort_1.retry(async () => {
            const connection = await this.pool.connect();
            return connection;
        });
        return database;
    }
    static async create({ doesIdentifierMatchItem, expirationTime = 15000, hostName, port, userName, password, database, encryptConnection, tableNames }) {
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
        disconnectWatcher.on('end', PostgresPriorityQueueStore.onUnexpectedClose);
        disconnectWatcher.on('error', (err) => {
            throw err;
        });
        await disconnectWatcher.connect();
        return new PostgresPriorityQueueStore({
            pool,
            tableNames,
            disconnectWatcher,
            doesIdentifierMatchItem,
            expirationTime
        });
    }
    async swapPositionsInPriorityQueue({ connection, firstQueue, secondQueue }) {
        await connection.query({
            name: 'swap positions in priority queue - first to temp',
            text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "indexInPriorityQueue" = -1
          WHERE "discriminator" = $1;
      `,
            values: [firstQueue.discriminator]
        });
        await connection.query({
            name: 'swap positions in priority queue - second to first',
            text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "indexInPriorityQueue" = $1
          WHERE "discriminator" = $2;
      `,
            values: [firstQueue.index, secondQueue.discriminator]
        });
        await connection.query({
            name: 'swap positions in priority queue - first to second',
            text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "indexInPriorityQueue" = $1
          WHERE "discriminator" = $2;
      `,
            values: [secondQueue.index, firstQueue.discriminator]
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
        const queuePriority = PostgresPriorityQueueStore.getPriority({ queue });
        const parentQueuePriority = PostgresPriorityQueueStore.getPriority({ queue: parentQueue });
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
        const queuePriority = PostgresPriorityQueueStore.getPriority({ queue });
        const leftChildQueuePriority = PostgresPriorityQueueStore.getPriority({ queue: leftChildQueue });
        const rightChildQueuePriority = rightChildQueue ?
            PostgresPriorityQueueStore.getPriority({ queue: rightChildQueue }) :
            Number.MAX_SAFE_INTEGER;
        if (queuePriority <= leftChildQueuePriority &&
            queuePriority <= rightChildQueuePriority) {
            return;
        }
        // eslint-disable-next-line unicorn/prefer-ternary
        if (leftChildQueuePriority <= rightChildQueuePriority) {
            await this.swapPositionsInPriorityQueue({
                connection,
                firstQueue: queue,
                secondQueue: leftChildQueue
            });
        }
        else {
            await this.swapPositionsInPriorityQueue({
                connection,
                firstQueue: queue,
                secondQueue: rightChildQueue
            });
        }
        await this.repairDown({ connection, discriminator: queue.discriminator });
    }
    async removeQueueInternal({ connection, discriminator }) {
        const { rows } = await connection.query({
            name: 'get raw queue',
            text: `
        SELECT "indexInPriorityQueue" FROM "${this.tableNames.priorityQueue}"
          WHERE "discriminator" = $1;
      `,
            values: [discriminator]
        });
        if (rows.length === 0) {
            throw new errors.InvalidOperation();
        }
        await connection.query({
            name: 'remove queue from priority queue',
            text: `
        DELETE FROM "${this.tableNames.priorityQueue}"
          WHERE "discriminator" = $1;
      `,
            values: [discriminator]
        });
        const { rows: [{ count }] } = await connection.query({
            name: 'check how many queues are left in the priority queue',
            text: `
        SELECT count(*) as count
          FROM "${this.tableNames.priorityQueue}";
      `
        });
        if (rows[0].indexInPriorityQueue >= count) {
            return;
        }
        await connection.query({
            name: 'move last queue in priority queue to index of removed queue',
            text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "indexInPriorityQueue" = $1
          WHERE "indexInPriorityQueue" = $2;
      `,
            values: [rows[0].indexInPriorityQueue, count]
        });
        const { rows: [{ discriminator: movedQueueDiscriminator }] } = await connection.query({
            name: 'get discriminator of moved queue',
            text: `
        SELECT "discriminator" FROM "${this.tableNames.priorityQueue}"
          WHERE "indexInPriorityQueue" = $1;
      `,
            values: [rows[0].indexInPriorityQueue]
        });
        await this.repairDown({ connection, discriminator: movedQueueDiscriminator });
    }
    async getQueueByDiscriminator({ connection, discriminator }) {
        const { rows } = await connection.query({
            name: 'get queue by discriminator',
            text: `
        SELECT
            pq."indexInPriorityQueue" AS "indexInPriorityQueue",
            i."priority" AS "priority",
            pq."lockUntil" AS "lockUntil",
            pq."lockToken" AS "lockToken"
          FROM "${this.tableNames.priorityQueue}" AS pq
          JOIN "${this.tableNames.items}" AS i
            ON pq."discriminator" = i."discriminator"
          WHERE pq."discriminator" = $1 AND i."indexInQueue" = 0;
      `,
            values: [discriminator]
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
        const { rows } = await connection.query({
            name: 'get queue by index in priority queue',
            text: `
        SELECT
            pq."discriminator" AS "discriminator",
            i."priority" AS "priority",
            pq."lockUntil" AS "lockUntil",
            pq."lockToken" AS "lockToken"
          FROM "${this.tableNames.priorityQueue}" AS pq
          JOIN "${this.tableNames.items}" AS i
            ON pq."discriminator" = i."discriminator"
          WHERE pq."indexInPriorityQueue" = $1 AND i."indexInQueue" = 0;
      `,
            values: [indexInPriorityQueue]
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
        const { rows: [{ item }] } = await connection.query({
            name: 'get first item in queue',
            text: `
        SELECT "item" FROM "${this.tableNames.items}"
          WHERE "discriminator" = $1
          ORDER BY "indexInQueue" ASC
          LIMIT 1
      `,
            values: [discriminator]
        });
        if (!item) {
            throw new errors.InvalidOperation();
        }
        return item;
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
        const { rows: [{ nextIndexInQueue }] } = await connection.query({
            name: 'get next index in queue',
            text: `
        SELECT COALESCE(MAX("indexInQueue") + 1, 0) AS "nextIndexInQueue"
          FROM "${this.tableNames.items}"
          WHERE "discriminator" = $1;
      `,
            values: [discriminator]
        });
        await connection.query({
            name: 'insert item into queue',
            text: `
        INSERT INTO "${this.tableNames.items}"
          ("discriminator", "indexInQueue", "priority", "item")
          VALUES ($1, $2, $3, $4);
      `,
            values: [discriminator, nextIndexInQueue, priority, item]
        });
        const { rows } = await connection.query({
            name: 'check if discriminator already exists in priority queue',
            text: `
        SELECT * FROM "${this.tableNames.priorityQueue}"
          WHERE "discriminator" = $1;
      `,
            values: [discriminator]
        });
        if (rows.length > 0) {
            return;
        }
        const { rows: [{ nextIndexInPriorityQueue }] } = await connection.query({
            name: 'get next index in priority queue',
            text: `
        SELECT COALESCE(MAX("indexInPriorityQueue") + 1, 0) AS "nextIndexInPriorityQueue"
          FROM "${this.tableNames.priorityQueue}";
      `
        });
        await connection.query({
            name: 'insert queue into priority queue',
            text: `
        INSERT INTO "${this.tableNames.priorityQueue}"
          ("discriminator", "indexInPriorityQueue")
          VALUES ($1, $2);
      `,
            values: [discriminator, nextIndexInPriorityQueue]
        });
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
                    connection.release();
                }
            });
        });
    }
    async lockNextInternal({ connection }) {
        const { rows } = await connection.query({
            name: 'get next unlocked queue in priority queue',
            text: `
        SELECT "discriminator" FROM "${this.tableNames.priorityQueue}"
          WHERE "lockUntil" IS NULL OR "lockUntil" <= $1
          ORDER BY "indexInPriorityQueue" ASC
          LIMIT 1
      `,
            values: [Date.now()]
        });
        if (rows.length === 0) {
            return;
        }
        const { discriminator } = rows[0];
        const item = await this.getFirstItemInQueue({ connection, discriminator });
        const until = Date.now() + this.expirationTime;
        const token = uuid_1.v4();
        await connection.query({
            name: 'lock queue',
            text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "lockUntil" = $1, "lockToken" = $2
          WHERE "discriminator" = $3
      `,
            values: [until, token, discriminator]
        });
        await this.repairDown({ connection, discriminator });
        return { item, metadata: { discriminator, token } };
    }
    async lockNext() {
        return await this.functionCallQueue.add(async () => await withTransaction_1.withTransaction({
            getConnection: async () => await this.getDatabase(),
            fn: async ({ connection }) => await this.lockNextInternal({ connection }),
            async releaseConnection({ connection }) {
                connection.release();
            }
        }));
    }
    async renewLockInternal({ connection, discriminator, token }) {
        const queue = await this.getQueueIfLocked({ connection, discriminator, token });
        const newUntil = Date.now() + this.expirationTime;
        await connection.query({
            name: 'renew lock on queue',
            text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "lockUntil" = $1
          WHERE "discriminator" = $2;
      `,
            values: [newUntil, queue.discriminator]
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
                    connection.release();
                }
            });
        });
    }
    async acknowledgeInternal({ connection, discriminator, token }) {
        const queue = await this.getQueueIfLocked({ connection, discriminator, token });
        await connection.query({
            name: 'remove item from queue',
            text: `
        DELETE FROM "${this.tableNames.items}"
          WHERE "discriminator" = $1
            AND "indexInQueue" = 0;
      `,
            values: [queue.discriminator]
        });
        await connection.query({
            name: 'defer constraints for following bulk update',
            text: `SET CONSTRAINTS "${this.tableNames.items}_pk" DEFERRED`
        });
        const { rowCount } = await connection.query({
            name: 'update indexes of items in queue',
            text: `
        UPDATE "${this.tableNames.items}"
          SET "indexInQueue" = "indexInQueue" - 1
          WHERE "discriminator" = $1;
      `,
            values: [queue.discriminator]
        });
        if (rowCount > 0) {
            // If the indexes of any item were changed, i.e. if there are still items in the queue...
            await connection.query({
                name: 'reset lock on queue',
                text: `
          UPDATE "${this.tableNames.priorityQueue}"
            SET "lockUntil" = NULL, "lockToken" = NULL
            WHERE "discriminator" = $1;
        `,
                values: [queue.discriminator]
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
                    connection.release();
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
                    connection.release();
                }
            });
        });
    }
    async removeInternal({ connection, discriminator, itemIdentifier }) {
        const queue = await this.getQueueByDiscriminator({ connection, discriminator });
        if (!queue) {
            throw new errors.ItemNotFound();
        }
        const { rows } = await connection.query({
            name: 'get all items in queue',
            text: `
        SELECT "item" FROM "${this.tableNames.items}"
          WHERE "discriminator" = $1
          ORDER BY "indexInQueue" ASC;
      `,
            values: [discriminator]
        });
        const items = rows.map(({ item }) => item);
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
            await connection.query({
                name: 'delete first item from queue',
                text: `
          DELETE FROM "${this.tableNames.items}"
            WHERE "discriminator" = $1
              AND "indexInQueue" = 0;
        `,
                values: [queue.discriminator]
            });
            await connection.query({
                name: 'move up remaining items in queue',
                text: `
          UPDATE "${this.tableNames.items}"
            SET "indexInQueue" = "indexInQueue" - 1
            WHERE "discriminator" = $1;
        `,
                values: [queue.discriminator]
            });
            await this.repairDown({ connection, discriminator: queue.discriminator });
            await this.repairUp({ connection, discriminator: queue.discriminator });
            return;
        }
        await connection.query({
            name: 'delete later item from queue',
            text: `
          DELETE FROM "${this.tableNames.items}"
            WHERE "discriminator" = $1
              AND "indexInQueue" = $2;
        `,
            values: [queue.discriminator, foundItemIndex]
        });
        await connection.query({
            name: 'move up remaining items later in queue',
            text: `
          UPDATE "${this.tableNames.items}"
            SET "indexInQueue" = "indexInQueue" - 1
            WHERE "discriminator" = $1
              AND "indexInQueue" > $2;
        `,
            values: [queue.discriminator, foundItemIndex]
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
                    connection.release();
                }
            });
        });
    }
    async setup() {
        const connection = await this.getDatabase();
        try {
            await retry_ignore_abort_1.retry(async () => {
                await connection.query({
                    name: 'create items table',
                    text: `
            CREATE TABLE IF NOT EXISTS "${this.tableNames.items}"
            (
              "discriminator" varchar(100) NOT NULL,
              "indexInQueue" integer NOT NULL,
              "priority" bigint NOT NULL,
              "item" jsonb NOT NULL,

              CONSTRAINT "${this.tableNames.items}_pk" PRIMARY KEY ("discriminator", "indexInQueue") DEFERRABLE
            );
          `
                });
                await connection.query({
                    name: 'create index on items table',
                    text: `
            CREATE INDEX IF NOT EXISTS "${this.tableNames.items}_index_discriminator" ON "${this.tableNames.items}" ("discriminator");
          `
                });
                await connection.query({
                    name: 'create priority queue table',
                    text: `
            CREATE TABLE IF NOT EXISTS "${this.tableNames.priorityQueue}"
            (
              "discriminator" varchar(100) NOT NULL,
              "indexInPriorityQueue" integer NOT NULL,
              "lockUntil" bigint,
              "lockToken" uuid,

              CONSTRAINT "${this.tableNames.priorityQueue}_pk" PRIMARY KEY ("discriminator")
            );
          `
                });
                await connection.query({
                    name: 'create index on priority queue table',
                    text: `
            CREATE UNIQUE INDEX IF NOT EXISTS "${this.tableNames.items}_index_indexInPriorityQueue" ON "${this.tableNames.priorityQueue}" ("indexInPriorityQueue");
          `
                });
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
        this.disconnectWatcher.removeListener('end', PostgresPriorityQueueStore.onUnexpectedClose);
        await this.disconnectWatcher.end();
        await this.pool.end();
    }
}
exports.PostgresPriorityQueueStore = PostgresPriorityQueueStore;
//# sourceMappingURL=PostgresPriorityQueueStore.js.map