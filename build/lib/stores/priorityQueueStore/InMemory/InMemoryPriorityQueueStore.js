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
exports.InMemoryPriorityQueueStore = void 0;
const getIndexOfLeftChild_1 = require("../shared/getIndexOfLeftChild");
const getIndexOfParent_1 = require("../shared/getIndexOfParent");
const getIndexOfRightChild_1 = require("../shared/getIndexOfRightChild");
const p_queue_1 = __importDefault(require("p-queue"));
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../common/errors"));
class InMemoryPriorityQueueStore {
    /* eslint-enable class-methods-use-this */
    constructor({ doesIdentifierMatchItem, options: { expirationTime } }) {
        this.doesIdentifierMatchItem = doesIdentifierMatchItem;
        this.expirationTime = expirationTime;
        this.queues = [];
        this.index = new Map();
        this.functionCallQueue = new p_queue_1.default({ concurrency: 1 });
    }
    /* eslint-disable class-methods-use-this */
    getPriority({ queue }) {
        if (queue.lock && queue.lock.until > Date.now()) {
            return Number.MAX_SAFE_INTEGER;
        }
        return queue.items[0].priority;
    }
    static async create({ doesIdentifierMatchItem, expirationTime = 15000 }) {
        return new InMemoryPriorityQueueStore({ doesIdentifierMatchItem, options: { expirationTime } });
    }
    repairUp({ queue }) {
        const index = this.index.get(queue.discriminator);
        if (index === undefined) {
            throw new errors.InvalidOperation();
        }
        if (index === 0) {
            return;
        }
        const parentIndex = getIndexOfParent_1.getIndexOfParent({ index });
        const parentQueue = this.queues[parentIndex];
        const queuePriority = this.getPriority({ queue });
        const parentPriority = this.getPriority({ queue: parentQueue });
        if (parentPriority <= queuePriority) {
            return;
        }
        this.queues[parentIndex] = queue;
        this.queues[index] = parentQueue;
        this.index.set(queue.discriminator, parentIndex);
        this.index.set(parentQueue.discriminator, index);
        this.repairUp({ queue });
    }
    repairDown({ queue }) {
        const index = this.index.get(queue.discriminator);
        if (index === undefined) {
            throw new errors.InvalidOperation();
        }
        const leftChildIndex = getIndexOfLeftChild_1.getIndexOfLeftChild({ index });
        const rightChildIndex = getIndexOfRightChild_1.getIndexOfRightChild({ index });
        if (leftChildIndex >= this.queues.length) {
            return;
        }
        const leftChildQueue = this.queues[leftChildIndex];
        const rightChildQueue = this.queues[rightChildIndex];
        const queuePriority = this.getPriority({ queue });
        const leftChildQueuePriority = this.getPriority({ queue: leftChildQueue });
        const rightChildQueuePriority = rightChildQueue ?
            this.getPriority({ queue: rightChildQueue }) :
            Number.MAX_SAFE_INTEGER;
        if (queuePriority <= leftChildQueuePriority &&
            queuePriority <= rightChildQueuePriority) {
            return;
        }
        if (leftChildQueuePriority <= rightChildQueuePriority) {
            this.queues[leftChildIndex] = queue;
            this.queues[index] = leftChildQueue;
            this.index.set(queue.discriminator, leftChildIndex);
            this.index.set(leftChildQueue.discriminator, index);
            this.repairDown({ queue });
        }
        else {
            this.queues[rightChildIndex] = queue;
            this.queues[index] = rightChildQueue;
            this.index.set(queue.discriminator, rightChildIndex);
            this.index.set(rightChildQueue.discriminator, index);
            this.repairDown({ queue });
        }
    }
    removeQueueInternal({ discriminator }) {
        const queueIndex = this.index.get(discriminator);
        if (queueIndex === undefined) {
            throw new errors.InvalidOperation();
        }
        const lastQueue = this.queues.pop();
        this.index.delete(lastQueue.discriminator);
        if (queueIndex >= this.queues.length) {
            return;
        }
        this.queues[queueIndex] = lastQueue;
        this.index.set(lastQueue.discriminator, queueIndex);
        this.index.delete(discriminator);
        this.repairDown({ queue: lastQueue });
    }
    getQueueIfLocked({ discriminator, token }) {
        const queueIndex = this.index.get(discriminator);
        if (queueIndex === undefined) {
            throw new errors.ItemNotFound(`Item for discriminator '${discriminator}' not found.`);
        }
        const queue = this.queues[queueIndex];
        if (!queue.lock) {
            throw new errors.ItemNotLocked(`Item for discriminator '${discriminator}' not locked.`);
        }
        if (queue.lock.token !== token) {
            throw new errors.TokenMismatch(`Token mismatch for discriminator '${discriminator}'.`);
        }
        return queue;
    }
    enqueueInternal({ item, discriminator, priority }) {
        var _a;
        const queueIndex = (_a = this.index.get(discriminator)) !== null && _a !== void 0 ? _a : this.queues.length;
        let queue = this.queues[queueIndex];
        if (!queue) {
            queue = {
                discriminator,
                items: []
            };
            this.queues.push(queue);
            this.index.set(discriminator, queueIndex);
        }
        queue.items.push({ item, priority });
        this.repairUp({ queue });
    }
    async enqueue({ item, discriminator, priority }) {
        await this.functionCallQueue.add(async () => this.enqueueInternal({ item, discriminator, priority }));
    }
    lockNextInternal() {
        if (this.queues.length === 0) {
            return;
        }
        const queue = this.queues[0];
        if (queue.lock && queue.lock.until > Date.now()) {
            return;
        }
        const item = queue.items[0];
        const until = Date.now() + this.expirationTime;
        const token = uuid_1.v4();
        queue.lock = { until, token };
        this.repairDown({ queue });
        return { item: item.item, metadata: { discriminator: queue.discriminator, token } };
    }
    async lockNext() {
        return await this.functionCallQueue.add(async () => this.lockNextInternal());
    }
    renewLockInternal({ discriminator, token }) {
        const queue = this.getQueueIfLocked({ discriminator, token });
        queue.lock.until = Date.now() + this.expirationTime;
        this.repairDown({ queue });
    }
    async renewLock({ discriminator, token }) {
        await this.functionCallQueue.add(async () => this.renewLockInternal({ discriminator, token }));
    }
    acknowledgeInternal({ discriminator, token }) {
        const queue = this.getQueueIfLocked({ discriminator, token });
        queue.items.shift();
        if (queue.items.length > 0) {
            queue.lock = undefined;
            this.repairDown({ queue });
            return;
        }
        this.removeQueueInternal({ discriminator: queue.discriminator });
    }
    async acknowledge({ discriminator, token }) {
        await this.functionCallQueue.add(async () => this.acknowledgeInternal({ discriminator, token }));
    }
    deferInternal({ discriminator, token, priority }) {
        const queue = this.getQueueIfLocked({ discriminator, token });
        const [{ item }] = queue.items;
        this.acknowledgeInternal({ discriminator, token });
        this.enqueueInternal({ item, discriminator, priority });
    }
    async defer({ discriminator, token, priority }) {
        await this.functionCallQueue.add(async () => this.deferInternal({ discriminator, token, priority }));
    }
    async removeInternal({ discriminator, itemIdentifier }) {
        const queueIndex = this.index.get(discriminator);
        if (queueIndex === undefined) {
            throw new errors.ItemNotFound();
        }
        const queue = this.queues[queueIndex];
        const foundItemIndex = queue.items.findIndex(({ item }) => this.doesIdentifierMatchItem({ item, itemIdentifier }));
        if (foundItemIndex === -1) {
            throw new errors.ItemNotFound();
        }
        if (foundItemIndex === 0) {
            if (queue.lock && queue.lock.until > Date.now()) {
                throw new errors.ItemNotFound();
            }
            if (queue.items.length === 1) {
                this.removeQueueInternal({ discriminator });
                return;
            }
            queue.items = queue.items.slice(1);
            this.repairDown({ queue });
            this.repairUp({ queue });
            return;
        }
        queue.items = [...queue.items.slice(0, foundItemIndex), ...queue.items.slice(foundItemIndex + 1)];
    }
    async remove({ discriminator, itemIdentifier }) {
        await this.functionCallQueue.add(async () => this.removeInternal({ discriminator, itemIdentifier }));
    }
    // eslint-disable-next-line class-methods-use-this
    async setup() {
        // There is nothing to do here.
    }
    destroyInternal() {
        this.queues = [];
        this.index = new Map();
        this.functionCallQueue.clear();
    }
    async destroy() {
        await this.functionCallQueue.add(async () => this.destroyInternal());
    }
}
exports.InMemoryPriorityQueueStore = InMemoryPriorityQueueStore;
//# sourceMappingURL=InMemoryPriorityQueueStore.js.map