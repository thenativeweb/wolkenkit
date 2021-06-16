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
exports.MongoDbPriorityQueueStore = void 0;
const getIndexOfLeftChild_1 = require("../shared/getIndexOfLeftChild");
const getIndexOfParent_1 = require("../shared/getIndexOfParent");
const getIndexOfRightChild_1 = require("../shared/getIndexOfRightChild");
const p_queue_1 = __importDefault(require("p-queue"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const url_1 = require("url");
const uuid_1 = require("uuid");
const withTransaction_1 = require("../../utils/mongoDb/withTransaction");
const mongodb_1 = require("mongodb");
const escapeFieldNames_1 = require("../../utils/mongoDb/escapeFieldNames");
const errors = __importStar(require("../../../common/errors"));
class MongoDbPriorityQueueStore {
    constructor({ client, db, collectionNames, collections, doesIdentifierMatchItem, expirationTime }) {
        this.client = client;
        this.db = db;
        this.collectionNames = collectionNames;
        this.collections = collections;
        this.doesIdentifierMatchItem = doesIdentifierMatchItem;
        this.expirationTime = expirationTime;
        this.functionCallQueue = new p_queue_1.default({ concurrency: 1 });
    }
    static getPriority({ queue }) {
        if (queue.lock && queue.lock.until > Date.now()) {
            return Number.MAX_SAFE_INTEGER;
        }
        return queue.items[0].priority;
    }
    static onUnexpectedClose() {
        throw new Error('Connection closed unexpectedly.');
    }
    static async create({ doesIdentifierMatchItem, expirationTime = 15000, connectionString, collectionNames }) {
        const client = await retry_ignore_abort_1.retry(async () => {
            const connection = await mongodb_1.MongoClient.connect(connectionString, 
            // eslint-disable-next-line id-length
            { w: 1, useNewUrlParser: true, useUnifiedTopology: true });
            return connection;
        });
        const { pathname } = new url_1.URL(connectionString);
        const databaseName = pathname.slice(1);
        const db = client.db(databaseName);
        db.on('close', MongoDbPriorityQueueStore.onUnexpectedClose);
        const collections = {
            queues: db.collection(collectionNames.queues)
        };
        return new MongoDbPriorityQueueStore({
            client,
            db,
            collectionNames,
            collections,
            doesIdentifierMatchItem,
            expirationTime
        });
    }
    async swapPositionsInPriorityQueue({ session, firstQueue, secondQueue }) {
        await this.collections.queues.updateOne({ discriminator: firstQueue.discriminator }, { $set: { indexInPriorityQueue: -1 } }, { session });
        await this.collections.queues.updateOne({ discriminator: secondQueue.discriminator }, { $set: { indexInPriorityQueue: firstQueue.indexInPriorityQueue } }, { session });
        await this.collections.queues.updateOne({ discriminator: firstQueue.discriminator }, { $set: { indexInPriorityQueue: secondQueue.indexInPriorityQueue } }, { session });
    }
    async repairUp({ session, discriminator }) {
        const queue = await this.getQueueByDiscriminator({ session, discriminator });
        if (!queue) {
            throw new errors.InvalidOperation();
        }
        if (queue.indexInPriorityQueue === 0) {
            return;
        }
        const parentIndex = getIndexOfParent_1.getIndexOfParent({ index: queue.indexInPriorityQueue });
        const parentQueue = (await this.getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue: parentIndex }));
        const queuePriority = MongoDbPriorityQueueStore.getPriority({ queue });
        const parentQueuePriority = MongoDbPriorityQueueStore.getPriority({ queue: parentQueue });
        if (parentQueuePriority <= queuePriority) {
            return;
        }
        await this.swapPositionsInPriorityQueue({
            session,
            firstQueue: queue,
            secondQueue: parentQueue
        });
        await this.repairUp({ session, discriminator: queue.discriminator });
    }
    async repairDown({ session, discriminator }) {
        const queue = await this.getQueueByDiscriminator({ session, discriminator });
        if (!queue) {
            throw new errors.InvalidOperation();
        }
        const leftChildIndex = getIndexOfLeftChild_1.getIndexOfLeftChild({ index: queue.indexInPriorityQueue });
        const rightChildIndex = getIndexOfRightChild_1.getIndexOfRightChild({ index: queue.indexInPriorityQueue });
        const leftChildQueue = await this.getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue: leftChildIndex });
        if (!leftChildQueue) {
            // If no left child is found, there is no layer beneath the current queue
            // and we can stop here.
            return;
        }
        const rightChildQueue = await this.getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue: rightChildIndex });
        const queuePriority = MongoDbPriorityQueueStore.getPriority({ queue });
        const leftChildQueuePriority = MongoDbPriorityQueueStore.getPriority({ queue: leftChildQueue });
        const rightChildQueuePriority = rightChildQueue ?
            MongoDbPriorityQueueStore.getPriority({ queue: rightChildQueue }) :
            Number.MAX_SAFE_INTEGER;
        if (queuePriority <= leftChildQueuePriority &&
            queuePriority <= rightChildQueuePriority) {
            return;
        }
        if (leftChildQueuePriority <= rightChildQueuePriority) {
            await this.swapPositionsInPriorityQueue({
                session,
                firstQueue: queue,
                secondQueue: leftChildQueue
            });
            await this.repairDown({ session, discriminator: queue.discriminator });
        }
        else {
            await this.swapPositionsInPriorityQueue({
                session,
                firstQueue: queue,
                secondQueue: rightChildQueue
            });
            await this.repairDown({ session, discriminator: queue.discriminator });
        }
    }
    async removeQueueInternal({ session, discriminator }) {
        const queue = await this.getQueueByDiscriminator({ session, discriminator });
        if (!queue) {
            throw new errors.InvalidOperation();
        }
        await this.collections.queues.deleteOne({ discriminator: queue.discriminator }, { session });
        const queueToUpdate = await this.collections.queues.findOne({}, { sort: [['indexInPriorityQueue', -1]], session });
        if (!queueToUpdate) {
            return;
        }
        if (queueToUpdate.indexInPriorityQueue < queue.indexInPriorityQueue) {
            return;
        }
        await this.collections.queues.updateOne({ discriminator: queueToUpdate.discriminator }, { $set: { indexInPriorityQueue: queue.indexInPriorityQueue } }, { session });
        await this.repairDown({ session, discriminator: queueToUpdate.discriminator });
    }
    async getQueueByDiscriminator({ session, discriminator }) {
        const queue = await this.collections.queues.findOne({ discriminator }, {
            session,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0 }
        });
        if (!queue) {
            return;
        }
        return queue;
    }
    async getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue }) {
        const queue = await this.collections.queues.findOne({ indexInPriorityQueue }, {
            session,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0 }
        });
        if (!queue) {
            return;
        }
        return queue;
    }
    async getQueueIfLocked({ session, discriminator, token }) {
        const queue = await this.getQueueByDiscriminator({ session, discriminator });
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
    async enqueueInternal({ session, item, discriminator, priority }) {
        let queue = await this.getQueueByDiscriminator({ session, discriminator });
        if (!queue) {
            const nextIndexInPriorityQueue = await this.collections.queues.countDocuments({}, { session });
            queue = {
                discriminator,
                indexInPriorityQueue: nextIndexInPriorityQueue,
                lock: undefined,
                items: []
            };
            await this.collections.queues.insertOne(queue, { session });
        }
        await this.collections.queues.updateOne({ discriminator }, { $push: { items: { item: escapeFieldNames_1.escapeFieldNames(item), priority } } }, { session });
        await this.repairUp({ session, discriminator });
    }
    async enqueue({ item, discriminator, priority }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                client: this.client,
                fn: async ({ session }) => {
                    await this.enqueueInternal({ session, item, discriminator, priority });
                }
            });
        });
    }
    async lockNextInternal({ session }) {
        const queue = await this.getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue: 0 });
        if (!queue) {
            return;
        }
        if (queue.lock && queue.lock.until > Date.now()) {
            return;
        }
        const item = queue.items[0];
        const until = Date.now() + this.expirationTime;
        const token = uuid_1.v4();
        await this.collections.queues.updateOne({ discriminator: queue.discriminator }, { $set: { lock: { until, token } } }, { session });
        await this.repairDown({ session, discriminator: queue.discriminator });
        return { item: escapeFieldNames_1.unescapeFieldNames(item.item), metadata: { discriminator: queue.discriminator, token } };
    }
    async lockNext() {
        return await this.functionCallQueue.add(async () => await withTransaction_1.withTransaction({
            client: this.client,
            fn: async ({ session }) => await this.lockNextInternal({ session })
        }));
    }
    async renewLockInternal({ session, discriminator, token }) {
        const queue = await this.getQueueIfLocked({ session, discriminator, token });
        await this.collections.queues.updateOne({ discriminator: queue.discriminator, 'lock.token': token }, { $set: { 'lock.until': Date.now() + this.expirationTime } }, { session });
        await this.repairDown({ session, discriminator: queue.discriminator });
    }
    async renewLock({ discriminator, token }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                client: this.client,
                fn: async ({ session }) => {
                    await this.renewLockInternal({ session, discriminator, token });
                }
            });
        });
    }
    async acknowledgeInternal({ session, discriminator, token }) {
        const queue = await this.getQueueIfLocked({ session, discriminator, token });
        await this.collections.queues.updateOne({ discriminator: queue.discriminator, 'lock.token': token }, { $pop: { items: -1 } }, { session });
        const queueAfterUpdate = (await this.getQueueByDiscriminator({ session, discriminator }));
        if (queueAfterUpdate.items.length > 0) {
            await this.collections.queues.updateOne({ discriminator: queueAfterUpdate.discriminator, 'lock.token': token }, { $set: { lock: undefined } }, { session });
            await this.repairDown({ session, discriminator });
            return;
        }
        await this.removeQueueInternal({ session, discriminator });
    }
    async acknowledge({ discriminator, token }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                client: this.client,
                fn: async ({ session }) => {
                    await this.acknowledgeInternal({ session, discriminator, token });
                }
            });
        });
    }
    async deferInternal({ session, discriminator, token, priority }) {
        const queue = await this.getQueueIfLocked({ session, discriminator, token });
        const item = queue.items[0];
        await this.acknowledgeInternal({ session, discriminator: queue.discriminator, token });
        await this.enqueueInternal({ session, item: escapeFieldNames_1.unescapeFieldNames(item.item), discriminator: queue.discriminator, priority });
    }
    async defer({ discriminator, token, priority }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                client: this.client,
                fn: async ({ session }) => {
                    await this.deferInternal({ session, discriminator, token, priority });
                }
            });
        });
    }
    async removeInternal({ session, discriminator, itemIdentifier }) {
        const queue = await this.getQueueByDiscriminator({ session, discriminator });
        if (!queue) {
            throw new errors.ItemNotFound();
        }
        const foundItemIndex = queue.items.findIndex(({ item }) => this.doesIdentifierMatchItem({ item: escapeFieldNames_1.unescapeFieldNames(item), itemIdentifier }));
        if (foundItemIndex === -1) {
            throw new errors.ItemNotFound();
        }
        if (foundItemIndex === 0) {
            if (queue.lock && queue.lock.until > Date.now()) {
                throw new errors.ItemNotFound();
            }
            if (queue.items.length === 1) {
                await this.removeQueueInternal({ session, discriminator });
                return;
            }
            queue.items = queue.items.slice(1);
            await this.collections.queues.replaceOne({ discriminator }, queue, { session });
            await this.repairDown({ session, discriminator: queue.discriminator });
            await this.repairUp({ session, discriminator: queue.discriminator });
            return;
        }
        queue.items = [...queue.items.slice(0, foundItemIndex), ...queue.items.slice(foundItemIndex + 1)];
        await this.collections.queues.replaceOne({ discriminator }, queue, { session });
    }
    async remove({ discriminator, itemIdentifier }) {
        await this.functionCallQueue.add(async () => {
            await withTransaction_1.withTransaction({
                client: this.client,
                fn: async ({ session }) => {
                    await this.removeInternal({ session, discriminator, itemIdentifier });
                }
            });
        });
    }
    async setup() {
        await this.collections.queues.createIndexes([
            {
                key: { discriminator: 1 },
                name: `${this.collectionNames.queues}_discriminator`,
                unique: true
            },
            {
                key: { indexInPriorityQueue: 1 },
                name: `${this.collectionNames.queues}_indexInPriorityQueue`,
                unique: true
            }
        ]);
    }
    async destroy() {
        this.db.removeListener('close', MongoDbPriorityQueueStore.onUnexpectedClose);
        await this.client.close(true);
    }
}
exports.MongoDbPriorityQueueStore = MongoDbPriorityQueueStore;
//# sourceMappingURL=MongoDbPriorityQueueStore.js.map