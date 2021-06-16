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
exports.PriorityQueueObserver = exports.observerErrors = void 0;
const stream_1 = require("stream");
const defekt_1 = require("defekt");
const errors = __importStar(require("../../../common/errors"));
const observerErrors = {
    ObserverError: class ObserverError extends defekt_1.defekt({ code: 'ObserverError' }) {
    }
};
exports.observerErrors = observerErrors;
class PriorityQueueObserver {
    constructor(queue) {
        this.queue = queue;
        this.events = new stream_1.PassThrough({ objectMode: true });
    }
    emitIssue(issue) {
        this.events.push(issue);
    }
    async enqueue({ item, discriminator, priority }) {
        this.emitIssue({
            type: 'action',
            message: 'enqueue',
            data: item
        });
        try {
            await this.queue.enqueue({ item, discriminator, priority });
        }
        catch (ex) {
            this.emitIssue({
                type: 'error',
                message: 'An error occured during enqueue.',
                data: ex
            });
            throw ex;
        }
    }
    async lockNext() {
        try {
            this.emitIssue({
                type: 'action',
                message: 'lockNext'
            });
            const nextItem = await this.queue.lockNext();
            if (nextItem === undefined) {
                this.emitIssue({
                    type: 'issue',
                    message: 'Couldn\'t lock next item.'
                });
            }
            return nextItem;
        }
        catch (ex) {
            this.emitIssue({
                type: 'error',
                message: 'An error occured during lockNext.',
                data: ex
            });
            throw ex;
        }
    }
    async renewLock({ discriminator, token }) {
        try {
            this.emitIssue({
                type: 'action',
                message: 'renewLock',
                data: { discriminator, token }
            });
            await this.queue.renewLock({ discriminator, token });
        }
        catch (ex) {
            if (defekt_1.isCustomError(ex)) {
                switch (ex.code) {
                    case errors.TokenMismatch.code:
                    case errors.ItemNotFound.code:
                    case errors.ItemNotLocked.code: {
                        this.emitIssue({
                            type: 'issue',
                            message: 'renewLock failed.',
                            data: ex
                        });
                        throw ex;
                    }
                    default: {
                        break;
                    }
                }
            }
            this.emitIssue({
                type: 'error',
                message: 'An error occured during renewLock.',
                data: ex
            });
            throw ex;
        }
    }
    async acknowledge({ discriminator, token }) {
        try {
            this.emitIssue({
                type: 'action',
                message: 'acknowledge',
                data: { discriminator, token }
            });
            await this.queue.acknowledge({ discriminator, token });
        }
        catch (ex) {
            if (defekt_1.isCustomError(ex)) {
                switch (ex.code) {
                    case errors.TokenMismatch.code:
                    case errors.ItemNotFound.code:
                    case errors.ItemNotLocked.code: {
                        this.emitIssue({
                            type: 'issue',
                            message: 'acknowledge failed.',
                            data: ex
                        });
                        throw ex;
                    }
                    default: {
                        break;
                    }
                }
            }
            this.emitIssue({
                type: 'error',
                message: 'An error occured during acknowledge.',
                data: ex
            });
            throw ex;
        }
    }
    async defer({ discriminator, token, priority }) {
        try {
            this.emitIssue({
                type: 'action',
                message: 'defer',
                data: { discriminator, token, priority }
            });
            await this.queue.defer({ discriminator, token, priority });
        }
        catch (ex) {
            if (defekt_1.isCustomError(ex)) {
                switch (ex.code) {
                    case errors.TokenMismatch.code:
                    case errors.ItemNotFound.code:
                    case errors.ItemNotLocked.code: {
                        this.emitIssue({
                            type: 'issue',
                            message: 'defer failed.',
                            data: ex
                        });
                        throw ex;
                    }
                    default: {
                        break;
                    }
                }
            }
            this.emitIssue({
                type: 'error',
                message: 'An error occured during defer.',
                data: ex
            });
            throw ex;
        }
    }
    async remove({ discriminator, itemIdentifier }) {
        try {
            this.emitIssue({
                type: 'action',
                message: 'remove',
                data: { discriminator, itemIdentifier }
            });
            await this.queue.remove({ discriminator, itemIdentifier });
        }
        catch (ex) {
            if (defekt_1.isCustomError(ex)) {
                switch (ex.code) {
                    case errors.ItemNotFound.code: {
                        this.emitIssue({
                            type: 'issue',
                            message: 'remove failed.',
                            data: ex
                        });
                        throw ex;
                    }
                    default: {
                        break;
                    }
                }
            }
            this.emitIssue({
                type: 'error',
                message: 'An error occured during remove.',
                data: ex
            });
            throw ex;
        }
    }
    async setup() {
        return this.queue.setup();
    }
    // eslint-disable-next-line @typescript-eslint/no-shadow
    static async create({ observedQueue }) {
        return new PriorityQueueObserver(observedQueue);
    }
    async destroy() {
        this.events.destroy();
        return this.queue.destroy();
    }
    getEvents() {
        return this.events;
    }
}
exports.PriorityQueueObserver = PriorityQueueObserver;
PriorityQueueObserver.defaultExpirationTime = 15000;
//# sourceMappingURL=PriorityQueueObserver.js.map