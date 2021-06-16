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
exports.MongoDbDomainEventStore = void 0;
const DomainEvent_1 = require("../../../common/elements/DomainEvent");
const omitDeepBy_1 = require("../../../common/utils/omitDeepBy");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const url_1 = require("url");
const withTransaction_1 = require("../../utils/mongoDb/withTransaction");
const mongodb_1 = require("mongodb");
const escapeFieldNames_1 = require("../../utils/mongoDb/escapeFieldNames");
const stream_1 = require("stream");
const errors = __importStar(require("../../../common/errors"));
class MongoDbDomainEventStore {
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
        db.on('close', MongoDbDomainEventStore.onUnexpectedClose);
        const collections = {
            domainEvents: db.collection(collectionNames.domainEvents),
            snapshots: db.collection(collectionNames.snapshots)
        };
        return new MongoDbDomainEventStore({
            client,
            db,
            collectionNames,
            collections
        });
    }
    async getLastDomainEvent({ aggregateIdentifier }) {
        const lastDomainEvent = await this.collections.domainEvents.findOne({
            'aggregateIdentifier.aggregate.id': aggregateIdentifier.aggregate.id
        }, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0 },
            sort: [['metadata.revision', -1]]
        });
        if (!lastDomainEvent) {
            return;
        }
        return new DomainEvent_1.DomainEvent(escapeFieldNames_1.unescapeFieldNames(lastDomainEvent));
    }
    async getDomainEventsByCausationId({ causationId }) {
        const domainEventStream = this.collections.domainEvents.find({
            'metadata.causationId': causationId
        }, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0 }
        }).stream();
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        let onData, onEnd, onError;
        const unsubscribe = function () {
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
        };
        onData = function (data) {
            passThrough.write(new DomainEvent_1.DomainEvent(escapeFieldNames_1.unescapeFieldNames(data)));
        };
        domainEventStream.on('data', onData);
        domainEventStream.on('end', onEnd);
        domainEventStream.on('error', onError);
        return passThrough;
    }
    async hasDomainEventsWithCausationId({ causationId }) {
        const domainEventCount = await this.collections.domainEvents.findOne({
            'metadata.causationId': causationId
        });
        return domainEventCount !== null;
    }
    async getDomainEventsByCorrelationId({ correlationId }) {
        const domainEventStream = this.collections.domainEvents.find({
            'metadata.correlationId': correlationId
        }, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0 }
        }).stream();
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        let onData, onEnd, onError;
        const unsubscribe = function () {
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
        };
        onData = function (data) {
            passThrough.write(new DomainEvent_1.DomainEvent(escapeFieldNames_1.unescapeFieldNames(data)));
        };
        domainEventStream.on('data', onData);
        domainEventStream.on('end', onEnd);
        domainEventStream.on('error', onError);
        return passThrough;
    }
    async getReplay({ fromTimestamp = 0 } = {}) {
        if (fromTimestamp < 0) {
            throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
        }
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const replayStream = this.collections.domainEvents.find({
            'metadata.timestamp': { $gte: fromTimestamp }
        }, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0 },
            sort: [['aggregateId', 1], ['metadata.revision', 1]]
        }).stream();
        let onData, onEnd, onError;
        const unsubscribe = function () {
            replayStream.removeListener('data', onData);
            replayStream.removeListener('end', onEnd);
            replayStream.removeListener('error', onError);
        };
        onData = function (data) {
            passThrough.write(new DomainEvent_1.DomainEvent(escapeFieldNames_1.unescapeFieldNames(data)));
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
            // In the PostgreSQL eventstore, we call replayStream.end() here. In
            // MongoDB, this function apparently is not implemented. This note is just
            // for informational purposes to ensure that you are aware that the two
            // implementations differ here.
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
            // In the PostgreSQL eventstore, we call replayStream.end() here. In
            // MongoDB, this function apparently is not implemented. This note is just
            // for informational purposes to ensure that you are aware that the two
            // implementations differ here.
        };
        replayStream.on('data', onData);
        replayStream.on('end', onEnd);
        replayStream.on('error', onError);
        return passThrough;
    }
    async getReplayForAggregate({ aggregateId, fromRevision = 1, toRevision = (2 ** 31) - 1 }) {
        if (fromRevision < 1) {
            throw new errors.ParameterInvalid(`Parameter 'fromRevision' must be at least 1.`);
        }
        if (toRevision < 1) {
            throw new errors.ParameterInvalid(`Parameter 'toRevision' must be at least 1.`);
        }
        if (fromRevision > toRevision) {
            throw new errors.ParameterInvalid(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
        }
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const domainEventStream = this.collections.domainEvents.find({
            $and: [
                { 'aggregateIdentifier.aggregate.id': aggregateId },
                { 'metadata.revision': { $gte: fromRevision } },
                { 'metadata.revision': { $lte: toRevision } }
            ]
        }, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0 },
            sort: [['metadata.revision', 1]]
        }).stream();
        let onData, onEnd, onError;
        const unsubscribe = function () {
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onData = function (data) {
            passThrough.write(new DomainEvent_1.DomainEvent(escapeFieldNames_1.unescapeFieldNames(data)));
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
            // In the PostgreSQL eventstore, we call domainEventStream.end() here. In
            // MongoDB, this function apparently is not implemented. This note is just
            // for informational purposes to ensure that you are aware that the two
            // implementations differ here.
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
            // In the PostgreSQL eventstore, we call domainEventStream.end() here. In
            // MongoDB, this function apparently is not implemented. This note is just
            // for informational purposes to ensure that you are aware that the two
            // implementations differ here.
        };
        domainEventStream.on('data', onData);
        domainEventStream.on('end', onEnd);
        domainEventStream.on('error', onError);
        return passThrough;
    }
    async storeDomainEvents({ domainEvents }) {
        if (domainEvents.length === 0) {
            throw new errors.ParameterInvalid('Domain events are missing.');
        }
        const sanitizedDomainEvents = domainEvents.map((domainEvent) => escapeFieldNames_1.escapeFieldNames({ ...new DomainEvent_1.DomainEvent({
                ...domainEvent,
                data: omitDeepBy_1.omitDeepBy(domainEvent.data, (value) => value === undefined)
            }) }));
        try {
            await withTransaction_1.withTransaction({
                client: this.client,
                fn: async ({ session }) => {
                    await this.collections.domainEvents.insertMany(sanitizedDomainEvents, { session });
                }
            });
        }
        catch (ex) {
            if (ex instanceof mongodb_1.MongoError &&
                ex.code === 11000 &&
                ex.message.includes('_aggregateId_revision')) {
                throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
            }
            throw ex;
        }
    }
    async getSnapshot({ aggregateIdentifier }) {
        const snapshot = await this.collections.snapshots.findOne({ aggregateIdentifier }, 
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { projection: { _id: false, revision: true, state: true } });
        if (!snapshot) {
            return;
        }
        const unescapedSnapshot = escapeFieldNames_1.unescapeFieldNames(snapshot);
        const mappedSnapshot = {
            aggregateIdentifier,
            revision: unescapedSnapshot.revision,
            state: unescapedSnapshot.state
        };
        return mappedSnapshot;
    }
    async storeSnapshot({ snapshot }) {
        await this.collections.snapshots.updateOne({ aggregateIdentifier: snapshot.aggregateIdentifier }, { $set: {
                ...snapshot,
                state: escapeFieldNames_1.escapeFieldNames(omitDeepBy_1.omitDeepBy(snapshot.state, (value) => value === undefined))
            } }, { upsert: true });
    }
    async getAggregateIdentifiers() {
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const replayStream = this.collections.domainEvents.find({
            'metadata.revision': { $eq: 1 }
        }, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0, aggregateIdentifier: 1 },
            sort: [['metadata.timestamp', 1]]
        }).stream();
        let onData, onEnd, onError;
        const unsubscribe = function () {
            replayStream.removeListener('data', onData);
            replayStream.removeListener('end', onEnd);
            replayStream.removeListener('error', onError);
        };
        onData = function (data) {
            passThrough.write(data.aggregateIdentifier);
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
            // In the PostgreSQL eventstore, we call replayStream.end() here. In
            // MongoDB, this function apparently is not implemented. This note is just
            // for informational purposes to ensure that you are aware that the two
            // implementations differ here.
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
            // In the PostgreSQL eventstore, we call replayStream.end() here. In
            // MongoDB, this function apparently is not implemented. This note is just
            // for informational purposes to ensure that you are aware that the two
            // implementations differ here.
        };
        replayStream.on('data', onData);
        replayStream.on('end', onEnd);
        replayStream.on('error', onError);
        return passThrough;
    }
    async getAggregateIdentifiersByName({ contextName, aggregateName }) {
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const replayStream = this.collections.domainEvents.find({
            'metadata.revision': { $eq: 1 },
            'aggregateIdentifier.context.name': { $eq: contextName },
            'aggregateIdentifier.aggregate.name': { $eq: aggregateName }
        }, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            projection: { _id: 0, aggregateIdentifier: 1 },
            sort: [['metadata.timestamp', 1]]
        }).stream();
        let onData, onEnd, onError;
        const unsubscribe = function () {
            replayStream.removeListener('data', onData);
            replayStream.removeListener('end', onEnd);
            replayStream.removeListener('error', onError);
        };
        onData = function (data) {
            passThrough.write(data.aggregateIdentifier);
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
            // In the PostgreSQL eventstore, we call replayStream.end() here. In
            // MongoDB, this function apparently is not implemented. This note is just
            // for informational purposes to ensure that you are aware that the two
            // implementations differ here.
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
            // In the PostgreSQL eventstore, we call replayStream.end() here. In
            // MongoDB, this function apparently is not implemented. This note is just
            // for informational purposes to ensure that you are aware that the two
            // implementations differ here.
        };
        replayStream.on('data', onData);
        replayStream.on('end', onEnd);
        replayStream.on('error', onError);
        return passThrough;
    }
    async setup() {
        await this.collections.domainEvents.createIndexes([
            {
                key: { 'aggregateIdentifier.aggregate.id': 1 },
                name: `${this.collectionNames.domainEvents}_aggregateId`
            },
            {
                key: { 'aggregateIdentifier.aggregate.id': 1, 'metadata.revision': 1 },
                name: `${this.collectionNames.domainEvents}_aggregateId_revision`,
                unique: true
            },
            {
                key: { 'metadata.causationId': 1 },
                name: `${this.collectionNames.domainEvents}_causationId`
            },
            {
                key: { 'metadata.correlationId': 1 },
                name: `${this.collectionNames.domainEvents}_correlationId`
            },
            {
                key: { 'metadata.timestamp': 1 },
                name: `${this.collectionNames.domainEvents}_timestamp`
            }
        ]);
        await this.collections.snapshots.createIndexes([
            {
                key: { 'aggregateIdentifier.aggregate.id': 1 },
                name: `${this.collectionNames.snapshots}_aggregateId`,
                unique: true
            }
        ]);
    }
    async destroy() {
        this.db.removeListener('close', MongoDbDomainEventStore.onUnexpectedClose);
        await this.client.close(true);
    }
}
exports.MongoDbDomainEventStore = MongoDbDomainEventStore;
//# sourceMappingURL=MongoDbDomainEventStore.js.map