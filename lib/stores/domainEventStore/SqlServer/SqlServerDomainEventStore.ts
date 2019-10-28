import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { createPool } from '../../utils/sqlServer/createPool';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { PassThrough } from 'stream';
import { Pool } from 'tarn';
import retry from 'async-retry';
import { Row } from './Row';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { ColumnValue, Connection, Request, TYPES } from 'tedious';

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
    hostname,
    port,
    username,
    password,
    database,
    encryptConnection = false,
    tableNames
  }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
  }): Promise<SqlServerDomainEventStore> {
    const pool = createPool({
      host: hostname,
      port,
      user: username,
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
            [revisionGlobal] BIGINT IDENTITY(1,1),
            [aggregateId] UNIQUEIDENTIFIER NOT NULL,
            [revisionAggregate] INT NOT NULL,
            [domainEvent] NVARCHAR(4000) NOT NULL,
            [isPublished] BIT NOT NULL,

            CONSTRAINT [${tableNames.domainEvents}_pk] PRIMARY KEY([revisionGlobal]),
            CONSTRAINT [${tableNames.domainEvents}_aggregateId_revisionAggregate] UNIQUE ([aggregateId], [revisionAggregate])
          );
        END

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${tableNames.snapshots}')
        BEGIN
          CREATE TABLE [${tableNames.snapshots}] (
            [aggregateId] UNIQUEIDENTIFIER NOT NULL,
            [revisionAggregate] INT NOT NULL,
            [state] NVARCHAR(4000) NOT NULL,

            CONSTRAINT [${tableNames.snapshots}_pk] PRIMARY KEY([aggregateId], [revisionAggregate])
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

  public async getLastDomainEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<DomainEventData> | undefined> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    try {
      const result: DomainEvent<DomainEventData> | undefined = await new Promise((resolve, reject): void => {
        let resultDomainEvent: DomainEvent<DomainEventData>;

        const request = new Request(`
          SELECT TOP(1) [domainEvent], [revisionGlobal]
            FROM ${this.tableNames.domainEvents}
            WHERE [aggregateId] = @aggregateId
            ORDER BY [revisionAggregate] DESC
          ;
        `, (err: Error | null): void => {
          if (err) {
            return reject(err);
          }

          resolve(resultDomainEvent);
        });

        request.once('row', (columns): void => {
          resultDomainEvent = new DomainEvent<DomainEventData>(JSON.parse(columns[0].value));

          resultDomainEvent = resultDomainEvent.withRevisionGlobal({
            revisionGlobal: Number(columns[1].value)
          });
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

  public async getDomainEventStream ({
    aggregateIdentifier,
    fromRevision = 1,
    toRevision = (2 ** 31) - 1
  }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<PassThrough> {
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
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
      let domainEvent = new DomainEvent<DomainEventData>(JSON.parse(columns[0].value));

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      if (columns[2].value) {
        domainEvent = domainEvent.asPublished();
      }

      passThrough.write(domainEvent);
    };

    request = new Request(`
      SELECT [domainEvent], [revisionAggregate], [isPublished]
        FROM [${this.tableNames.domainEvents}]
        WHERE [aggregateId] = @aggregateId
          AND [revisionAggregate] >= @fromRevision
          AND [revisionAggregate] <= @toRevision
        ORDER BY [revisionAggregate]`, (err: Error | null): void => {
      unsubscribe();

      if (err) {
        passThrough.emit('error', err);
      }

      passThrough.end();
    });

    request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateIdentifier.id);
    request.addParameter('fromRevision', TYPES.Int, fromRevision);
    request.addParameter('toRevision', TYPES.Int, toRevision);

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
  }

  public async getUnpublishedDomainEventStream (): Promise<PassThrough> {
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
      let domainEvent = new DomainEvent<DomainEventData>(JSON.parse(columns[0].value));

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      if (columns[2].value) {
        domainEvent = domainEvent.asPublished();
      }

      passThrough.write(domainEvent);
    };

    request = new Request(`
      SELECT [domainEvent], [revisionGlobal], [isPublished]
        FROM [${this.tableNames.domainEvents}]
        WHERE [isPublished] = 0
        ORDER BY [revisionGlobal]
      `, (err: Error | null): void => {
      unsubscribe();

      if (err) {
        passThrough.emit('error', err);
      }

      passThrough.end();
    });

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
  }

  public async saveDomainEvents ({ domainEvents }: {
    domainEvents: DomainEvent<DomainEventData>[];
  }): Promise<DomainEvent<DomainEventData>[]> {
    if (domainEvents.length === 0) {
      throw new Error('Domain events are missing.');
    }

    const placeholders = [],
          values: Row[] = [];

    let resultCount = 0;

    for (const [ index, domainEvent ] of domainEvents.entries()) {
      const rowId = index + 1;
      const row = [
        { key: `aggregateId${rowId}`, value: domainEvent.aggregateIdentifier.id, type: TYPES.UniqueIdentifier, options: undefined },
        { key: `revisionAggregate${rowId}`, value: domainEvent.metadata.revision.aggregate, type: TYPES.Int, options: undefined },
        { key: `event${rowId}`, value: JSON.stringify(domainEvent), type: TYPES.NVarChar, options: { length: 4000 }},
        { key: `isPublished${rowId}`, value: domainEvent.metadata.isPublished, type: TYPES.Bit, options: undefined }
      ];

      placeholders.push(`(@${row[0].key}, @${row[1].key}, @${row[2].key}, @${row[3].key})`);

      values.push(...row);
    }

    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    const text = `
      INSERT INTO [${this.tableNames.domainEvents}] ([aggregateId], [revisionAggregate], [domainEvent], [isPublished])
        OUTPUT INSERTED.[revisionGlobal]
      VALUES ${placeholders.join(',')};
    `;

    const savedDomainEvents: DomainEvent<DomainEventData>[] = [];

    try {
      await new Promise((resolve, reject): void => {
        let onRow: (columns: ColumnValue[]) => void;

        const request = new Request(text, (err: Error | null): void => {
          request.removeListener('row', onRow);

          if (err) {
            return reject(err);
          }

          resolve();
        });

        for (const value of values) {
          request.addParameter(value.key, value.type, value.value, value.options);
        }

        onRow = (columns: ColumnValue[]): void => {
          const domainEvent = domainEvents[resultCount];
          const savedDomainEvent = domainEvent.withRevisionGlobal({
            revisionGlobal: Number(columns[0].value)
          });

          savedDomainEvents.push(savedDomainEvent);
          resultCount += 1;
        };

        request.on('row', onRow);

        database.execSql(request);
      });
    } catch (ex) {
      if (ex.code === 'EREQUEST' && ex.number === 2627 && ex.message.includes('_aggregateId_revisionAggregate')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      this.pool.release(database);
    }

    return savedDomainEvents;
  }

  public async markDomainEventsAsPublished ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }): Promise<void> {
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    try {
      await new Promise((resolve, reject): void => {
        const request = new Request(`
          UPDATE [${this.tableNames.domainEvents}]
            SET [isPublished] = 1
            WHERE [aggregateId] = @aggregateId
              AND [revisionAggregate] >= @fromRevision
              AND [revisionAggregate] <= @toRevision
          `, (err: Error | null): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateIdentifier.id);
        request.addParameter('fromRevision', TYPES.Int, fromRevision);
        request.addParameter('toRevision', TYPES.Int, toRevision);

        database.execSql(request);
      });
    } finally {
      this.pool.release(database);
    }
  }

  public async getSnapshot ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<State> | undefined> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    try {
      const result: Snapshot<State> | undefined = await new Promise((resolve, reject): void => {
        let resultRow: Snapshot<State>;

        const request = new Request(`
          SELECT TOP(1) [state], [revisionAggregate]
            FROM ${this.tableNames.snapshots}
            WHERE [aggregateId] = @aggregateId
            ORDER BY [revisionAggregate] DESC
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

  public async saveSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    const database = await SqlServerDomainEventStore.getDatabase(this.pool);

    try {
      await new Promise((resolve, reject): void => {
        const request = new Request(`
          IF NOT EXISTS (SELECT TOP(1) * FROM ${this.tableNames.snapshots} WHERE [aggregateId] = @aggregateId and [revisionAggregate] = @revisionAggregate)
            BEGIN
              INSERT INTO [${this.tableNames.snapshots}] ([aggregateId], [revisionAggregate], [state])
              VALUES (@aggregateId, @revisionAggregate, @state);
            END
          `, (err: Error | null): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, snapshot.aggregateIdentifier.id);
        request.addParameter('revisionAggregate', TYPES.Int, snapshot.revision);
        request.addParameter('state', TYPES.NVarChar, JSON.stringify(snapshot.state), { length: 4000 });

        database.execSql(request);
      });
    } finally {
      this.pool.release(database);
    }
  }

  public async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  } = {}): Promise<PassThrough> {
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new Error('From revision global is greater than to revision global.');
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
      let domainEvent = new DomainEvent<DomainEventData>(JSON.parse(columns[0].value));

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      passThrough.write(domainEvent);
    };

    request = new Request(`
      SELECT [domainEvent], [revisionGlobal]
        FROM [${this.tableNames.domainEvents}]
        WHERE [revisionGlobal] >= @fromRevisionGlobal
          AND [revisionGlobal] <= @toRevisionGlobal
        ORDER BY [revisionGlobal]`, (err: Error | null): void => {
      unsubscribe();

      if (err) {
        passThrough.emit('error', err);
      }

      passThrough.end();
    });

    request.addParameter('fromRevisionGlobal', TYPES.BigInt, fromRevisionGlobal);
    request.addParameter('toRevisionGlobal', TYPES.BigInt, toRevisionGlobal);

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
  }

  public async destroy (): Promise<void> {
    await this.pool.destroy();
  }
}

export { SqlServerDomainEventStore };
