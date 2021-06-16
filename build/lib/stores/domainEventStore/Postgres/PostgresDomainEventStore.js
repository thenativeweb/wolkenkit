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
exports.PostgresDomainEventStore = void 0;
const DomainEvent_1 = require("../../../common/elements/DomainEvent");
const omitDeepBy_1 = require("../../../common/utils/omitDeepBy");
const pg_query_stream_1 = __importDefault(require("pg-query-stream"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const pg_1 = require("pg");
const stream_1 = require("stream");
const errors = __importStar(require("../../../common/errors"));
class PostgresDomainEventStore {
    constructor({ pool, tableNames, disconnectWatcher }) {
        this.pool = pool;
        this.tableNames = tableNames;
        this.disconnectWatcher = disconnectWatcher;
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
    static async create({ hostName, port, userName, password, database, encryptConnection = { rejectUnauthorized: false }, tableNames }) {
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
        disconnectWatcher.on('end', PostgresDomainEventStore.onUnexpectedClose);
        disconnectWatcher.on('error', (err) => {
            throw err;
        });
        await disconnectWatcher.connect();
        return new PostgresDomainEventStore({
            pool,
            tableNames,
            disconnectWatcher
        });
    }
    async getLastDomainEvent({ aggregateIdentifier }) {
        const connection = await this.getDatabase();
        try {
            const result = await connection.query({
                name: 'get last domain event',
                text: `
          SELECT "domainEvent"
            FROM "${this.tableNames.domainEvents}"
            WHERE "aggregateId" = $1
            ORDER BY "revision" DESC
            LIMIT 1
        `,
                values: [aggregateIdentifier.aggregate.id]
            });
            if (result.rows.length === 0) {
                return;
            }
            const domainEvent = new DomainEvent_1.DomainEvent(result.rows[0].domainEvent);
            return domainEvent;
        }
        finally {
            connection.release();
        }
    }
    async getDomainEventsByCausationId({ causationId }) {
        const connection = await this.getDatabase();
        const domainEventStream = connection.query(new pg_query_stream_1.default(`SELECT "domainEvent"
          FROM "${this.tableNames.domainEvents}"
          WHERE "causationId" = $1`, [causationId]));
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        let onData, onEnd, onError;
        const unsubscribe = function () {
            connection.release();
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onData = function (data) {
            const domainEvent = new DomainEvent_1.DomainEvent(data.domainEvent);
            passThrough.write(domainEvent);
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
        };
        domainEventStream.on('data', onData);
        domainEventStream.on('end', onEnd);
        domainEventStream.on('error', onError);
        return passThrough;
    }
    async hasDomainEventsWithCausationId({ causationId }) {
        const connection = await this.getDatabase();
        try {
            const result = await connection.query({
                name: 'has domain event with causation id',
                text: `SELECT 1
          FROM "${this.tableNames.domainEvents}"
          WHERE "causationId" = $1`,
                values: [causationId]
            });
            return result.rows.length > 0;
        }
        finally {
            connection.release();
        }
    }
    async getDomainEventsByCorrelationId({ correlationId }) {
        const connection = await this.getDatabase();
        const domainEventStream = connection.query(new pg_query_stream_1.default(`SELECT "domainEvent"
          FROM "${this.tableNames.domainEvents}"
          WHERE "correlationId" = $1`, [correlationId]));
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        let onData, onEnd, onError;
        const unsubscribe = function () {
            connection.release();
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onData = function (data) {
            const domainEvent = new DomainEvent_1.DomainEvent(data.domainEvent);
            passThrough.write(domainEvent);
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
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
        const connection = await this.getDatabase();
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const domainEventStream = connection.query(new pg_query_stream_1.default(`
        SELECT "domainEvent"
          FROM "${this.tableNames.domainEvents}"
          WHERE "timestamp" >= $1
          ORDER BY "aggregateId", "revision"`, [fromTimestamp]));
        let onData, onEnd, onError;
        const unsubscribe = function () {
            connection.release();
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onData = function (data) {
            const domainEvent = new DomainEvent_1.DomainEvent(data.domainEvent);
            passThrough.write(domainEvent);
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
        };
        domainEventStream.on('data', onData);
        domainEventStream.on('end', onEnd);
        domainEventStream.on('error', onError);
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
        const connection = await this.getDatabase();
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const domainEventStream = connection.query(new pg_query_stream_1.default(`
        SELECT "domainEvent"
          FROM "${this.tableNames.domainEvents}"
          WHERE "aggregateId" = $1
            AND "revision" >= $2
            AND "revision" <= $3
          ORDER BY "revision"`, [aggregateId, fromRevision, toRevision]));
        let onData, onEnd, onError;
        const unsubscribe = function () {
            connection.release();
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onData = function (data) {
            const domainEvent = new DomainEvent_1.DomainEvent(data.domainEvent);
            passThrough.write(domainEvent);
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
        };
        domainEventStream.on('data', onData);
        domainEventStream.on('end', onEnd);
        domainEventStream.on('error', onError);
        return passThrough;
    }
    async storeDomainEvents({ domainEvents }) {
        var _a;
        if (domainEvents.length === 0) {
            throw new errors.ParameterInvalid('Domain events are missing.');
        }
        const placeholders = [], values = [];
        for (const [index, domainEvent] of domainEvents.entries()) {
            const base = (6 * index) + 1;
            placeholders.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
            values.push(domainEvent.aggregateIdentifier.aggregate.id, domainEvent.metadata.revision, domainEvent.metadata.causationId, domainEvent.metadata.correlationId, domainEvent.metadata.timestamp, omitDeepBy_1.omitDeepBy(domainEvent, (value) => value === undefined));
        }
        const connection = await this.getDatabase();
        const text = `
      INSERT INTO "${this.tableNames.domainEvents}"
        ("aggregateId", "revision", "causationId", "correlationId", "timestamp", "domainEvent")
      VALUES
        ${placeholders.join(',')};
    `;
        try {
            await connection.query({
                name: `store domain events ${domainEvents.length}`,
                text,
                values
            });
        }
        catch (ex) {
            if (ex.code === '23505' && ((_a = ex.detail) === null || _a === void 0 ? void 0 : _a.startsWith('Key ("aggregateId", revision)'))) {
                throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
            }
            throw ex;
        }
        finally {
            connection.release();
        }
    }
    async getSnapshot({ aggregateIdentifier }) {
        const connection = await this.getDatabase();
        try {
            const result = await connection.query({
                name: 'get snapshot',
                text: `
          SELECT "state", "revision"
            FROM "${this.tableNames.snapshots}"
            WHERE "aggregateId" = $1
            ORDER BY "revision" DESC
            LIMIT 1
        `,
                values: [aggregateIdentifier.aggregate.id]
            });
            if (result.rows.length === 0) {
                return;
            }
            return {
                aggregateIdentifier,
                revision: result.rows[0].revision,
                state: result.rows[0].state
            };
        }
        finally {
            connection.release();
        }
    }
    async storeSnapshot({ snapshot }) {
        const connection = await this.getDatabase();
        try {
            await connection.query({
                name: 'store snapshot',
                text: `
        INSERT INTO "${this.tableNames.snapshots}" (
          "aggregateId", "revision", state
        ) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING;
        `,
                values: [
                    snapshot.aggregateIdentifier.aggregate.id,
                    snapshot.revision,
                    omitDeepBy_1.omitDeepBy(snapshot.state, (value) => value === undefined)
                ]
            });
        }
        finally {
            connection.release();
        }
    }
    async getAggregateIdentifiers() {
        const connection = await this.getDatabase();
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const domainEventStream = connection.query(new pg_query_stream_1.default(`
        SELECT "domainEvent", "timestamp"
          FROM "${this.tableNames.domainEvents}"
          WHERE "revision" = 1
          ORDER BY "timestamp"`));
        let onData, onEnd, onError;
        const unsubscribe = function () {
            connection.release();
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onData = function (data) {
            passThrough.write(data.domainEvent.aggregateIdentifier);
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
        };
        domainEventStream.on('data', onData);
        domainEventStream.on('end', onEnd);
        domainEventStream.on('error', onError);
        return passThrough;
    }
    async getAggregateIdentifiersByName({ contextName, aggregateName }) {
        const connection = await this.getDatabase();
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const domainEventStream = connection.query(new pg_query_stream_1.default(`
        SELECT "domainEvent", "timestamp"
          FROM "${this.tableNames.domainEvents}"
          WHERE "revision" = 1
          ORDER BY "timestamp"`));
        let onData, onEnd, onError;
        const unsubscribe = function () {
            connection.release();
            domainEventStream.removeListener('data', onData);
            domainEventStream.removeListener('end', onEnd);
            domainEventStream.removeListener('error', onError);
        };
        onData = function (data) {
            if (data.domainEvent.aggregateIdentifier.context.name !== contextName ||
                data.domainEvent.aggregateIdentifier.aggregate.name !== aggregateName) {
                return;
            }
            passThrough.write(data.domainEvent.aggregateIdentifier);
        };
        onEnd = function () {
            unsubscribe();
            passThrough.end();
        };
        onError = function (err) {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
        };
        domainEventStream.on('data', onData);
        domainEventStream.on('end', onEnd);
        domainEventStream.on('error', onError);
        return passThrough;
    }
    async setup() {
        const connection = await this.getDatabase();
        try {
            await retry_ignore_abort_1.retry(async () => {
                await connection.query(`
          CREATE TABLE IF NOT EXISTS "${this.tableNames.domainEvents}" (
            "aggregateId" uuid NOT NULL,
            "revision" integer NOT NULL,
            "causationId" uuid NOT NULL,
            "correlationId" uuid NOT NULL,
            "timestamp" bigint NOT NULL,
            "domainEvent" jsonb NOT NULL,

            CONSTRAINT "${this.tableNames.domainEvents}_pk" PRIMARY KEY ("aggregateId", "revision")
          );
          CREATE TABLE IF NOT EXISTS "${this.tableNames.snapshots}" (
            "aggregateId" uuid NOT NULL,
            "revision" integer NOT NULL,
            "state" jsonb NOT NULL,

            CONSTRAINT "${this.tableNames.snapshots}_pk" PRIMARY KEY ("aggregateId", "revision")
          );
        `);
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
        this.disconnectWatcher.removeListener('end', PostgresDomainEventStore.onUnexpectedClose);
        await this.disconnectWatcher.end();
        await this.pool.end();
    }
}
exports.PostgresDomainEventStore = PostgresDomainEventStore;
//# sourceMappingURL=PostgresDomainEventStore.js.map