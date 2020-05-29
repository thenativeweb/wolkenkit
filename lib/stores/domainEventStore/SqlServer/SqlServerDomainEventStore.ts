import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { createPool } from '../../utils/sqlServer/createPool';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { errors } from '../../../common/errors';
import { Pool } from 'tarn';
import { retry } from 'retry-ignore-abort';
import { Row } from './Row';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { ColumnValue, Connection, Request, TYPES } from 'tedious';
import { PassThrough, Readable } from 'stream';

class SqlServerDomainEventStore implements DomainEventStore {
  protected pool: Pool<Connection>;

  protected tableNames: TableNames;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected static async getDatabase (pool: Pool<Connection>): Promise<Connection> {
    const database = await retry(async (): Promise<Connection> => {
      const connection = await pool.acquire().promise;

      return connection;
    });

    return database;
  }

  protected constructor ({ pool, tableNames }: {
    pool: Pool<Connection>;
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
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
  }): Promise<SqlServerDomainEventStore> {
    const pool = createPool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      encrypt: encryptConnection,

      onError (err): never {
        throw err;
      },

      onDisconnect (): void {
        SqlServerDomainEventStore.onUnexpectedClose();
      }
    });

    const domainEventStore = new SqlServerDomainEventStore({ pool, tableNames });
    const connection = await SqlServerDomainEventStore.getDatabase(pool);

    const query = `
      BEGIN TRANSACTION setupTables;

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${tableNames.domainEvents}')
        BEGIN
          CREATE TABLE [${tableNames.domainEvents}] (
            [aggregateId] UNIQUEIDENTIFIER NOT NULL,
            [revision] INT NOT NULL,
            [causationId] UNIQUEIDENTIFIER NOT NULL,
            [correlationId] UNIQUEIDENTIFIER NOT NULL,
            [timestamp] BIGINT NOT NULL,
            [domainEvent] NVARCHAR(4000) NOT NULL,

            CONSTRAINT [${tableNames.domainEvents}_pk] PRIMARY KEY([aggregateId], [revision])
          );
        END

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${tableNames.snapshots}')
        BEGIN
          CREATE TABLE [${tableNames.snapshots}] (
            [aggregateId] UNIQUEIDENTIFIER NOT NULL,
            [revision] INT NOT NULL,
            [state] NVARCHAR(4000) NOT NULL,

            CONSTRAINT [${tableNames.snapshots}_pk] PRIMARY KEY([aggregateId], [revision])
          );
        END

      COMMIT TRANSACTION setupTables;
    `;

    await new Promise((resolve, reject): void => {
      const request = new Request(query, (err: Error | null): void => {
        if (err) {
          // When multiple clients initialize at the same time, e.g. during
          // integration tests, SQL Server might throw an error. In this case
          // we simply ignore it.
          if (err.message.includes('There is already an object named')) {
            return resolve();
          }

          return reject(err);
        }

        resolve();
      });

      connection.execSql(request);
    });

    pool.release(connection);

    return domainEventStore;
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    try {
      const result: DomainEvent<TDomainEventData> | undefined = await new Promise((resolve, reject): void => {
        let resultDomainEvent: DomainEvent<TDomainEventData>;

        const request = new Request(`
          SELECT TOP(1) [domainEvent]
            FROM [${this.tableNames.domainEvents}]
            WHERE [aggregateId] = @aggregateId
            ORDER BY [revision] DESC
          ;
        `, (err: Error | null): void => {
          if (err) {
            return reject(err);
          }

          resolve(resultDomainEvent);
        });

        request.once('row', (columns): void => {
          resultDomainEvent = new DomainEvent<TDomainEventData>(JSON.parse(columns[0].value));
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateIdentifier.id);

        database.execSql(request);
      });

      if (!result) {
        return;
      }

      return result;
    } finally {
      this.pool.release(database);
    }
  }

  public async getDomainEventsByCausationId <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });

    let onError: (err: Error) => void,
        onRow: (columns: ColumnValue[]) => void,
        request: Request;

    const unsubscribe = (): void => {
      this.pool.release(database);
      request.removeListener('error', onError);
      request.removeListener('row', onRow);
    };

    onError = (err: Error): void => {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onRow = (columns: ColumnValue[]): void => {
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(columns[0].value));

      passThrough.write(domainEvent);
    };

    request = new Request(
      `SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [causationId] = @causationId;`
      , (err: Error | null): void => {
        unsubscribe();

        if (err) {
          passThrough.emit('error', err);
        }

        passThrough.end();
      }
    );

    request.addParameter('causationId', TYPES.UniqueIdentifier, causationId);

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
  }

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    try {
      const result: boolean = await new Promise((resolve, reject): void => {
        let hasDomainEvents = false;

        const request = new Request(`
          SELECT 1
            FROM [${this.tableNames.domainEvents}]
            WHERE [causationId] = @causationId
          ;
        `, (err: Error | null): void => {
          if (err) {
            return reject(err);
          }

          resolve(hasDomainEvents);
        });

        request.once('row', (): void => {
          hasDomainEvents = true;
        });

        request.addParameter('causationId', TYPES.UniqueIdentifier, causationId);

        database.execSql(request);
      });

      return result;
    } finally {
      this.pool.release(database);
    }
  }

  public async getDomainEventsByCorrelationId <TDomainEventData extends DomainEventData> ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });

    let onError: (err: Error) => void,
        onRow: (columns: ColumnValue[]) => void,
        request: Request;

    const unsubscribe = (): void => {
      this.pool.release(database);
      request.removeListener('error', onError);
      request.removeListener('row', onRow);
    };

    onError = (err: Error): void => {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onRow = (columns: ColumnValue[]): void => {
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(columns[0].value));

      passThrough.write(domainEvent);
    };

    request = new Request(
      `SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [correlationId] = @correlationId;`
      , (err: Error | null): void => {
        unsubscribe();

        if (err) {
          passThrough.emit('error', err);
        }

        passThrough.end();
      }
    );

    request.addParameter('correlationId', TYPES.UniqueIdentifier, correlationId);

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
  }

  public async getReplay ({
    fromTimestamp = 0
  }: {
    fromTimestamp?: number;
  } = {}): Promise<Readable> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
    }

    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });

    let onError: (err: Error) => void,
        onRow: (columns: ColumnValue[]) => void,
        request: Request;

    const unsubscribe = (): void => {
      this.pool.release(database);
      request.removeListener('error', onError);
      request.removeListener('row', onRow);
    };

    onError = (err: Error): void => {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onRow = (columns: ColumnValue[]): void => {
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(columns[0].value));

      passThrough.write(domainEvent);
    };

    request = new Request(`
      SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [timestamp] >= @fromTimestamp
        ORDER BY [aggregateId], [revision]`, (err: Error | null): void => {
      unsubscribe();

      if (err) {
        passThrough.emit('error', err);
      }

      passThrough.end();
    });

    request.addParameter('fromTimestamp', TYPES.BigInt, fromTimestamp);

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
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

    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });

    let onError: (err: Error) => void,
        onRow: (columns: ColumnValue[]) => void,
        request: Request;

    const unsubscribe = (): void => {
      this.pool.release(database);
      request.removeListener('row', onRow);
      request.removeListener('error', onError);
    };

    onError = (err): void => {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onRow = (columns: ColumnValue[]): void => {
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(columns[0].value));

      passThrough.write(domainEvent);
    };

    request = new Request(`
      SELECT [domainEvent]
        FROM [${this.tableNames.domainEvents}]
        WHERE [aggregateId] = @aggregateId
          AND [revision] >= @fromRevision
          AND [revision] <= @toRevision
        ORDER BY [revision]`, (err: Error | null): void => {
      unsubscribe();

      if (err) {
        passThrough.emit('error', err);
      }

      passThrough.end();
    });

    request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateId);
    request.addParameter('fromRevision', TYPES.Int, fromRevision);
    request.addParameter('toRevision', TYPES.Int, toRevision);

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
  }

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<void> {
    if (domainEvents.length === 0) {
      throw new errors.ParameterInvalid('Domain events are missing.');
    }

    const placeholders = [],
          values: Row[] = [];

    for (const [ index, domainEvent ] of domainEvents.entries()) {
      const rowId = index + 1;
      const row = [
        { key: `aggregateId${rowId}`, value: domainEvent.aggregateIdentifier.id, type: TYPES.UniqueIdentifier, options: undefined },
        { key: `revision${rowId}`, value: domainEvent.metadata.revision, type: TYPES.Int, options: undefined },
        { key: `causationId${rowId}`, value: domainEvent.metadata.causationId, type: TYPES.UniqueIdentifier, options: undefined },
        { key: `correlationId${rowId}`, value: domainEvent.metadata.correlationId, type: TYPES.UniqueIdentifier, options: undefined },
        { key: `timestamp${rowId}`, value: domainEvent.metadata.timestamp, type: TYPES.BigInt, options: undefined },
        { key: `event${rowId}`, value: JSON.stringify(domainEvent), type: TYPES.NVarChar, options: { length: 4000 }}
      ];

      placeholders.push(`(@${row[0].key}, @${row[1].key}, @${row[2].key}, @${row[3].key}, @${row[4].key}, @${row[5].key})`);

      values.push(...row);
    }

    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    const text = `
      INSERT INTO [${this.tableNames.domainEvents}] ([aggregateId], [revision], [causationId], [correlationId], [timestamp], [domainEvent])
      VALUES ${placeholders.join(',')};
    `;

    try {
      await new Promise((resolve, reject): void => {
        const request = new Request(text, (err: Error | null): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        for (const value of values) {
          request.addParameter(value.key, value.type, value.value, value.options);
        }

        database.execSql(request);
      });
    } catch (ex) {
      if (ex.code === 'EREQUEST' && ex.number === 2627 && ex.message.startsWith('Violation of PRIMARY KEY constraint')) {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      this.pool.release(database);
    }
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    try {
      const result: Snapshot<TState> | undefined = await new Promise((resolve, reject): void => {
        let resultRow: Snapshot<TState>;

        const request = new Request(`
          SELECT TOP(1) [state], [revision]
            FROM [${this.tableNames.snapshots}]
            WHERE [aggregateId] = @aggregateId
            ORDER BY [revision] DESC
          ;`, (err: Error | null): void => {
          if (err) {
            return reject(err);
          }

          resolve(resultRow);
        });

        request.once('row', (columns: ColumnValue[]): void => {
          resultRow = {
            aggregateIdentifier,
            state: JSON.parse(columns[0].value),
            revision: Number(columns[1].value)
          };
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateIdentifier.id);

        database.execSql(request);
      });

      if (!result) {
        return;
      }

      return result;
    } finally {
      this.pool.release(database);
    }
  }

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    try {
      await new Promise((resolve, reject): void => {
        const request = new Request(`
          IF NOT EXISTS (SELECT TOP(1) * FROM [${this.tableNames.snapshots}] WHERE [aggregateId] = @aggregateId and [revision] = @revision)
            BEGIN
              INSERT INTO [${this.tableNames.snapshots}] ([aggregateId], [revision], [state])
              VALUES (@aggregateId, @revision, @state);
            END
          `, (err: Error | null): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, snapshot.aggregateIdentifier.id);
        request.addParameter('revision', TYPES.Int, snapshot.revision);
        request.addParameter('state', TYPES.NVarChar, JSON.stringify(snapshot.state), { length: 4000 });

        database.execSql(request);
      });
    } finally {
      this.pool.release(database);
    }
  }

  public async destroy (): Promise<void> {
    await this.pool.destroy();
  }
}

export { SqlServerDomainEventStore };
