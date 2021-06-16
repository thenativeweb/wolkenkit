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
exports.SqlServerDomainEventStore = void 0;
const DomainEvent_1 = require("../../../common/elements/DomainEvent");
const ToDomainEventStream_1 = require("../../utils/sqlServer/ToDomainEventStream");
const mssql_1 = require("mssql");
const stream_1 = require("stream");
const errors = __importStar(require("../../../common/errors"));
class SqlServerDomainEventStore {
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
            SqlServerDomainEventStore.onUnexpectedClose();
        });
        await pool.connect();
        return new SqlServerDomainEventStore({ pool, tableNames });
    }
    async getLastDomainEvent({ aggregateIdentifier }) {
        const request = this.pool.request();
        request.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
        const { recordset } = await request.query(`
      SELECT TOP(1) [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [aggregateId] = @aggregateId
        ORDER BY [revision] DESC;
    `);
        if (recordset.length === 0) {
            return;
        }
        const lastDomainEvent = new DomainEvent_1.DomainEvent(JSON.parse(recordset[0].domainEvent));
        return lastDomainEvent;
    }
    async getDomainEventsByCausationId({ causationId }) {
        const request = this.pool.request();
        const toDomainEventStream = new ToDomainEventStream_1.ToDomainEventStream();
        request.input('causationId', mssql_1.TYPES.UniqueIdentifier, causationId);
        request.stream = true;
        request.pipe(toDomainEventStream);
        await request.query(`
      SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [causationId] = @causationId;
    `);
        return toDomainEventStream;
    }
    async hasDomainEventsWithCausationId({ causationId }) {
        const request = this.pool.request();
        request.input('causationId', mssql_1.TYPES.UniqueIdentifier, causationId);
        const { recordset } = await request.query(`
      SELECT 1
        FROM [${this.tableNames.domainEvents}]
        WHERE [causationId] = @causationId;
    `);
        return recordset.length > 0;
    }
    async getDomainEventsByCorrelationId({ correlationId }) {
        const request = this.pool.request();
        const toDomainEventStream = new ToDomainEventStream_1.ToDomainEventStream();
        request.input('correlationId', mssql_1.TYPES.UniqueIdentifier, correlationId);
        request.stream = true;
        request.pipe(toDomainEventStream);
        await request.query(`
      SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [correlationId] = @correlationId;
    `);
        return toDomainEventStream;
    }
    async getReplay({ fromTimestamp = 0 } = {}) {
        if (fromTimestamp < 0) {
            throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
        }
        const request = this.pool.request();
        const toDomainEventStream = new ToDomainEventStream_1.ToDomainEventStream();
        request.input('fromTimestamp', mssql_1.TYPES.BigInt, fromTimestamp);
        request.stream = true;
        request.pipe(toDomainEventStream);
        await request.query(`
      SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [timestamp] >= @fromTimestamp
        ORDER BY [aggregateId], [revision];
    `);
        return toDomainEventStream;
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
        const request = this.pool.request();
        const toDomainEventStream = new ToDomainEventStream_1.ToDomainEventStream();
        request.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateId);
        request.input('fromRevision', mssql_1.TYPES.Int, fromRevision);
        request.input('toRevision', mssql_1.TYPES.Int, toRevision);
        request.stream = true;
        request.pipe(toDomainEventStream);
        await request.query(`
      SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [aggregateId] = @aggregateId
          AND [revision] >= @fromRevision
          AND [revision] <= @toRevision
        ORDER BY [revision];
    `);
        return toDomainEventStream;
    }
    async storeDomainEvents({ domainEvents }) {
        if (domainEvents.length === 0) {
            throw new errors.ParameterInvalid('Domain events are missing.');
        }
        const table = new mssql_1.Table(this.tableNames.domainEvents);
        table.columns.add('aggregateId', mssql_1.TYPES.UniqueIdentifier, { nullable: false });
        table.columns.add('revision', mssql_1.TYPES.Int, { nullable: false });
        table.columns.add('causationId', mssql_1.TYPES.UniqueIdentifier, { nullable: false });
        table.columns.add('correlationId', mssql_1.TYPES.UniqueIdentifier, { nullable: false });
        table.columns.add('timestamp', mssql_1.TYPES.BigInt, { nullable: false });
        table.columns.add('domainEvent', mssql_1.TYPES.NVarChar, { nullable: false });
        for (const domainEvent of domainEvents.values()) {
            table.rows.add(domainEvent.aggregateIdentifier.aggregate.id, domainEvent.metadata.revision, domainEvent.metadata.causationId, domainEvent.metadata.correlationId, domainEvent.metadata.timestamp, JSON.stringify(domainEvent));
        }
        const request = this.pool.request();
        try {
            await request.bulk(table);
        }
        catch (ex) {
            if (ex instanceof mssql_1.RequestError &&
                ex.code === 'EREQUEST' &&
                ex.number === 2627 &&
                ex.message.startsWith('Violation of PRIMARY KEY constraint')) {
                throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
            }
            throw ex;
        }
    }
    async getSnapshot({ aggregateIdentifier }) {
        const request = this.pool.request();
        request.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, aggregateIdentifier.aggregate.id);
        const { recordset } = await request.query(`
      SELECT TOP(1) [state], [revision]
        FROM [${this.tableNames.snapshots}]
        WHERE [aggregateId] = @aggregateId
        ORDER BY [revision] DESC;
    `);
        if (recordset.length === 0) {
            return;
        }
        const snapshot = {
            aggregateIdentifier,
            state: JSON.parse(recordset[0].state),
            revision: Number(recordset[0].revision)
        };
        return snapshot;
    }
    async storeSnapshot({ snapshot }) {
        const request = this.pool.request();
        request.input('aggregateId', mssql_1.TYPES.UniqueIdentifier, snapshot.aggregateIdentifier.aggregate.id);
        request.input('revision', mssql_1.TYPES.Int, snapshot.revision);
        request.input('state', mssql_1.TYPES.NVarChar, JSON.stringify(snapshot.state));
        await request.query(`
      IF NOT EXISTS (SELECT TOP(1) * FROM [${this.tableNames.snapshots}] WHERE [aggregateId] = @aggregateId and [revision] = @revision)
        BEGIN
          INSERT INTO [${this.tableNames.snapshots}] ([aggregateId], [revision], [state])
          VALUES (@aggregateId, @revision, @state);
        END
    `);
    }
    async getAggregateIdentifiers() {
        const request = this.pool.request();
        const toDomainEventStream = new ToDomainEventStream_1.ToDomainEventStream();
        const toAggregateIdentifierStream = new stream_1.Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                callback(null, chunk.aggregateIdentifier);
            }
        });
        request.stream = true;
        request.pipe(toDomainEventStream);
        toDomainEventStream.pipe(toAggregateIdentifierStream);
        await request.query(`
      SELECT [domainEvent], [timestamp]
        FROM [${this.tableNames.domainEvents}]
        WHERE [revision] = 1
        ORDER BY [timestamp];
    `);
        return toAggregateIdentifierStream;
    }
    async getAggregateIdentifiersByName({ contextName, aggregateName }) {
        const request = this.pool.request();
        const toDomainEventStream = new ToDomainEventStream_1.ToDomainEventStream();
        const toAggregateIdentifierStream = new stream_1.Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                if (chunk.aggregateIdentifier.context.name !== contextName ||
                    chunk.aggregateIdentifier.aggregate.name !== aggregateName) {
                    callback(null);
                    return;
                }
                callback(null, chunk.aggregateIdentifier);
            }
        });
        request.stream = true;
        request.pipe(toDomainEventStream);
        toDomainEventStream.pipe(toAggregateIdentifierStream);
        await request.query(`
      SELECT [domainEvent], [timestamp]
        FROM [${this.tableNames.domainEvents}]
        WHERE [revision] = 1
        ORDER BY [timestamp];
    `);
        return toAggregateIdentifierStream;
    }
    async setup() {
        try {
            await this.pool.query(`
        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.domainEvents}')
          BEGIN
            CREATE TABLE [${this.tableNames.domainEvents}] (
              [aggregateId] UNIQUEIDENTIFIER NOT NULL,
              [revision] INT NOT NULL,
              [causationId] UNIQUEIDENTIFIER NOT NULL,
              [correlationId] UNIQUEIDENTIFIER NOT NULL,
              [timestamp] BIGINT NOT NULL,
              [domainEvent] NVARCHAR(4000) NOT NULL,

              CONSTRAINT [${this.tableNames.domainEvents}_pk] PRIMARY KEY([aggregateId], [revision])
            );
          END

        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.snapshots}')
          BEGIN
            CREATE TABLE [${this.tableNames.snapshots}] (
              [aggregateId] UNIQUEIDENTIFIER NOT NULL,
              [revision] INT NOT NULL,
              [state] NVARCHAR(4000) NOT NULL,

              CONSTRAINT [${this.tableNames.snapshots}_pk] PRIMARY KEY([aggregateId], [revision])
            );
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
exports.SqlServerDomainEventStore = SqlServerDomainEventStore;
//# sourceMappingURL=SqlServerDomainEventStore.js.map