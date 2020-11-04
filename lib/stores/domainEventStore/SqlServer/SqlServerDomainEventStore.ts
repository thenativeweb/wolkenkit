import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { errors } from '../../../common/errors';
import { Readable } from 'stream';
import { Snapshot } from '../Snapshot';
import { SqlServerDomainEventStoreOptions } from './SqlServerDomainEventStoreOptions';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { ToDomainEventStream } from '../../utils/sqlServer/ToDomainEventStream';
import { ConnectionPool, RequestError, Table, TYPES as Types } from 'mssql';

class SqlServerDomainEventStore implements DomainEventStore {
  protected pool: ConnectionPool;

  protected tableNames: TableNames;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected constructor ({ pool, tableNames }: {
    pool: ConnectionPool;
    tableNames: TableNames;
  }) {
    this.pool = pool;
    this.tableNames = tableNames;
  }

  public static async create ({
    hostName,
    port,
    userName,
    password,
    database,
    encryptConnection = false,
    tableNames
  }: SqlServerDomainEventStoreOptions): Promise<SqlServerDomainEventStore> {
    const pool = new ConnectionPool({
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

    pool.on('error', (): void => {
      SqlServerDomainEventStore.onUnexpectedClose();
    });

    await pool.connect();

    return new SqlServerDomainEventStore({ pool, tableNames });
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const request = this.pool.request();

    request.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.id);

    const { recordset } = await request.query(`
      SELECT TOP(1) [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [aggregateId] = @aggregateId
        ORDER BY [revision] DESC;
    `);

    if (recordset.length === 0) {
      return;
    }

    const lastDomainEvent = new DomainEvent<TDomainEventData>(JSON.parse(recordset[0].domainEvent));

    return lastDomainEvent;
  }

  public async getDomainEventsByCausationId ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    const request = this.pool.request();
    const toDomainEventStream = new ToDomainEventStream();

    request.input('causationId', Types.UniqueIdentifier, causationId);
    request.stream = true;
    request.pipe(toDomainEventStream);

    await request.query(`
      SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [causationId] = @causationId;
    `);

    return toDomainEventStream;
  }

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    const request = this.pool.request();

    request.input('causationId', Types.UniqueIdentifier, causationId);

    const { recordset } = await request.query(`
      SELECT 1
        FROM [${this.tableNames.domainEvents}]
        WHERE [causationId] = @causationId;
    `);

    return recordset.length > 0;
  }

  public async getDomainEventsByCorrelationId ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    const request = this.pool.request();
    const toDomainEventStream = new ToDomainEventStream();

    request.input('correlationId', Types.UniqueIdentifier, correlationId);
    request.stream = true;
    request.pipe(toDomainEventStream);

    await request.query(`
      SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [correlationId] = @correlationId;
    `);

    return toDomainEventStream;
  }

  public async getReplay ({
    fromTimestamp = 0
  }: {
    fromTimestamp?: number;
  } = {}): Promise<Readable> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
    }

    const request = this.pool.request();
    const toDomainEventStream = new ToDomainEventStream();

    request.input('fromTimestamp', Types.BigInt, fromTimestamp);
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

  public async getReplayForAggregate ({
    aggregateId,
    fromRevision = 1,
    toRevision = (2 ** 31) - 1
  }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<Readable> {
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
    const toDomainEventStream = new ToDomainEventStream();

    request.input('aggregateId', Types.UniqueIdentifier, aggregateId);
    request.input('fromRevision', Types.Int, fromRevision);
    request.input('toRevision', Types.Int, toRevision);

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

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<void> {
    if (domainEvents.length === 0) {
      throw new errors.ParameterInvalid('Domain events are missing.');
    }

    const table = new Table(this.tableNames.domainEvents);

    table.columns.add('aggregateId', Types.UniqueIdentifier, { nullable: false });
    table.columns.add('revision', Types.Int, { nullable: false });
    table.columns.add('causationId', Types.UniqueIdentifier, { nullable: false });
    table.columns.add('correlationId', Types.UniqueIdentifier, { nullable: false });
    table.columns.add('timestamp', Types.BigInt, { nullable: false });
    table.columns.add('domainEvent', Types.NVarChar, { nullable: false });

    for (const domainEvent of domainEvents.values()) {
      table.rows.add(
        domainEvent.aggregateIdentifier.id,
        domainEvent.metadata.revision,
        domainEvent.metadata.causationId,
        domainEvent.metadata.correlationId,
        domainEvent.metadata.timestamp,
        JSON.stringify(domainEvent)
      );
    }

    const request = this.pool.request();

    try {
      await request.bulk(table);
    } catch (ex: unknown) {
      if (
        ex instanceof RequestError &&
        ex.code === 'EREQUEST' &&
        ex.number === 2_627 &&
        ex.message.startsWith('Violation of PRIMARY KEY constraint')
      ) {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
      }

      throw ex;
    }
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const request = this.pool.request();

    request.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.id);

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

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    const request = this.pool.request();

    request.input('aggregateId', Types.UniqueIdentifier, snapshot.aggregateIdentifier.id);
    request.input('revision', Types.Int, snapshot.revision);
    request.input('state', Types.NVarChar, JSON.stringify(snapshot.state));

    await request.query(`
      IF NOT EXISTS (SELECT TOP(1) * FROM [${this.tableNames.snapshots}] WHERE [aggregateId] = @aggregateId and [revision] = @revision)
        BEGIN
          INSERT INTO [${this.tableNames.snapshots}] ([aggregateId], [revision], [state])
          VALUES (@aggregateId, @revision, @state);
        END
    `);
  }

  public async setup (): Promise<void> {
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
    } catch (ex: unknown) {
      if (!(ex as Error).message.includes('There is already an object named')) {
        throw ex;
      }

      // When multiple clients initialize at the same time, e.g. during
      // integration tests, SQL Server might throw an error. In this case we
      // simply ignore it
    }
  }

  public async destroy (): Promise<void> {
    await this.pool.close();
  }
}

export { SqlServerDomainEventStore };
