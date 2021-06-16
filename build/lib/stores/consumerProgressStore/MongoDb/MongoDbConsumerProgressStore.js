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
exports.MongoDbConsumerProgressStore = void 0;
const retry_ignore_abort_1 = require("retry-ignore-abort");
const url_1 = require("url");
const withTransaction_1 = require("../../utils/mongoDb/withTransaction");
const mongodb_1 = require("mongodb");
const errors = __importStar(require("../../../common/errors"));
class MongoDbConsumerProgressStore {
    constructor({ client, db, collectionNames, collections }) {
        this.client = client;
        this.db = db;
        this.collectionNames = collectionNames;
        this.collections = collections;
    }
    static onUnexpectedClose() {
        throw new Error('Connection closed unexpectedly.');
    }
    static async create({ connectionString, collectionNames }) {
        const client = await retry_ignore_abort_1.retry(async () => {
            const connection = await mongodb_1.MongoClient.connect(connectionString, 
            // eslint-disable-next-line id-length
            { w: 1, useNewUrlParser: true, useUnifiedTopology: true });
            return connection;
        });
        const { pathname } = new url_1.URL(connectionString);
        const databaseName = pathname.slice(1);
        const db = client.db(databaseName);
        db.on('close', MongoDbConsumerProgressStore.onUnexpectedClose);
        const collections = {
            progress: db.collection(collectionNames.progress)
        };
        return new MongoDbConsumerProgressStore({
            client,
            db,
            collectionNames,
            collections
        });
    }
    async getProgress({ consumerId, aggregateIdentifier }) {
        const result = await this.collections.progress.findOne({
            consumerId,
            aggregateId: aggregateIdentifier.aggregate.id
        });
        if (!result) {
            return { revision: 0, isReplaying: false };
        }
        return { revision: result.revision, isReplaying: result.isReplaying };
    }
    async setProgress({ consumerId, aggregateIdentifier, revision }) {
        if (revision < 0) {
            throw new errors.ParameterInvalid('Revision must be at least zero.');
        }
        await withTransaction_1.withTransaction({
            client: this.client,
            fn: async ({ session }) => {
                const { matchedCount } = await this.collections.progress.updateOne({
                    consumerId,
                    aggregateId: aggregateIdentifier.aggregate.id,
                    revision: { $lt: revision }
                }, { $set: { revision } }, { session });
                if (matchedCount === 1) {
                    return;
                }
                try {
                    await this.collections.progress.insertOne({ consumerId, aggregateId: aggregateIdentifier.aggregate.id, revision, isReplaying: false }, { session });
                }
                catch {
                    throw new errors.RevisionTooLow();
                }
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
        await withTransaction_1.withTransaction({
            client: this.client,
            fn: async ({ session }) => {
                const { matchedCount } = await this.collections.progress.updateOne({
                    consumerId,
                    aggregateId: aggregateIdentifier.aggregate.id,
                    isReplaying: { $eq: false }
                }, { $set: { isReplaying } }, { session });
                if (matchedCount === 1) {
                    return;
                }
                try {
                    await this.collections.progress.insertOne({ consumerId, aggregateId: aggregateIdentifier.aggregate.id, revision: 0, isReplaying }, { session });
                }
                catch {
                    throw new errors.FlowIsAlreadyReplaying();
                }
            }
        });
    }
    async resetProgress({ consumerId }) {
        await withTransaction_1.withTransaction({
            client: this.client,
            fn: async ({ session }) => {
                await this.collections.progress.deleteMany({ consumerId }, { session });
            }
        });
    }
    async resetProgressToRevision({ consumerId, aggregateIdentifier, revision }) {
        const { revision: currentRevision } = await this.getProgress({ consumerId, aggregateIdentifier });
        if (currentRevision < revision) {
            throw new errors.ParameterInvalid('Can not reset a consumer to a newer revision than it currently is at.');
        }
        await withTransaction_1.withTransaction({
            client: this.client,
            fn: async ({ session }) => {
                if (revision < 0) {
                    throw new errors.ParameterInvalid('Revision must be at least zero.');
                }
                await this.collections.progress.deleteMany({ consumerId }, { session });
                const { matchedCount } = await this.collections.progress.updateOne({
                    consumerId,
                    aggregateId: aggregateIdentifier.aggregate.id
                }, { $set: { revision, isReplaying: false } }, { session });
                if (matchedCount === 1) {
                    return;
                }
                await this.collections.progress.insertOne({ consumerId, aggregateId: aggregateIdentifier.aggregate.id, revision, isReplaying: false }, { session });
            }
        });
    }
    async setup() {
        await this.collections.progress.createIndexes([{
                key: { consumerId: 1, aggregateId: 1 },
                name: `${this.collectionNames.progress}_consumerId_aggregateId`,
                unique: true
            }]);
    }
    async destroy() {
        this.db.removeListener('close', MongoDbConsumerProgressStore.onUnexpectedClose);
        await this.client.close(true);
    }
}
exports.MongoDbConsumerProgressStore = MongoDbConsumerProgressStore;
//# sourceMappingURL=MongoDbConsumerProgressStore.js.map