import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import createPool from '../../utils/sqlServer/createPool';
import EventExternal from '../../../common/elements/EventExternal';
import EventInternal from '../../../common/elements/EventInternal';
import { Eventstore } from '../Eventstore';
import limitAlphanumeric from '../../../common/utils/limitAlphanumeric';
import omitByDeep from '../../../common/utils/omitByDeep';
import { PassThrough } from 'stream';
import { Pool } from 'tarn';
import retry from 'async-retry';
import { Row } from './Row';
import { Snapshot } from '../Snapshot';
import { ColumnValue, Connection, Request, TYPES } from 'tedious';

class SqlServerEventstore implements Eventstore {
  protected pool: Pool<Connection>;

  protected namespace: string;

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

  protected constructor ({ pool, namespace }: {
    pool: Pool<Connection>;
    namespace: string;
  }) {
    this.pool = pool;
    this.namespace = namespace;
  }

  public static async create ({
    hostname,
    port,
    username,
    password,
    database,
    encryptConnection = false,
    namespace
  }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    encryptConnection: boolean;
    namespace: string;
  }): Promise<SqlServerEventstore> {
    const prefixedNamespace = `store_${limitAlphanumeric(namespace)}`;

    const pool = createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      encrypt: encryptConnection,

      onError (err: Error): void {
        throw err;
      },

      onDisconnect (): void {
        SqlServerEventstore.onUnexpectedClose();
      }
    });

    const eventstore = new SqlServerEventstore({
      pool,
      namespace: prefixedNamespace
    });

    const connection = await SqlServerEventstore.getDatabase(pool);

    const query = `
      BEGIN TRANSACTION setupTables;

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${prefixedNamespace}_events')
        BEGIN
          CREATE TABLE [${prefixedNamespace}_events] (
            [revisionGlobal] BIGINT IDENTITY(1,1),
            [aggregateId] UNIQUEIDENTIFIER NOT NULL,
            [revisionAggregate] INT NOT NULL,
            [event] NVARCHAR(4000) NOT NULL,
            [isPublished] BIT NOT NULL,

            CONSTRAINT [${prefixedNamespace}_events_pk] PRIMARY KEY([revisionGlobal]),
            CONSTRAINT [${prefixedNamespace}_aggregateId_revisionAggregate] UNIQUE ([aggregateId], [revisionAggregate])
          );
        END

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${prefixedNamespace}_snapshots')
        BEGIN
          CREATE TABLE [${prefixedNamespace}_snapshots] (
            [aggregateId] UNIQUEIDENTIFIER NOT NULL,
            [revisionAggregate] INT NOT NULL,
            [state] NVARCHAR(4000) NOT NULL,

            CONSTRAINT [${prefixedNamespace}_snapshots_pk] PRIMARY KEY([aggregateId], [revisionAggregate])
          );
        END

      COMMIT TRANSACTION setupTables;
    `;

    await new Promise((resolve, reject): void => {
      const request = new Request(query, (err?: Error): void => {
        if (err) {
          // When multiple clients initialize at the same time, e.g. during
          // integration tests, SQL Server might throw an error. In this case
          // we simply ignore it.
          if (/There is already an object named.*_events/u.exec(err.message)) {
            return resolve();
          }

          return reject(err);
        }

        resolve();
      });

      connection.execSql(request);
    });

    pool.release(connection);

    return eventstore;
  }

  public async getLastEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<EventExternal | undefined> {
    const database = await SqlServerEventstore.getDatabase(this.pool);

    try {
      const result: EventExternal | undefined = await new Promise((resolve, reject): void => {
        let resultEvent: EventExternal;

        const request = new Request(`
          SELECT TOP(1) [event], [revisionGlobal]
            FROM ${this.namespace}_events
            WHERE [aggregateId] = @aggregateId
            ORDER BY [revisionAggregate] DESC
          ;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(resultEvent);
        });

        request.once('row', (columns): void => {
          resultEvent = EventExternal.deserialize(JSON.parse(columns[0].value));

          resultEvent = resultEvent.setRevisionGlobal({
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

  public async getEventStream ({
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

    const database = await SqlServerEventstore.getDatabase(this.pool);

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
      let event = EventExternal.deserialize(JSON.parse(columns[0].value));

      event = event.setRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      if (columns[2].value) {
        event = event.markAsPublished();
      }

      passThrough.write(event);
    };

    request = new Request(`
      SELECT [event], [revisionAggregate], [isPublished]
        FROM [${this.namespace}_events]
        WHERE [aggregateId] = @aggregateId
          AND [revisionAggregate] >= @fromRevision
          AND [revisionAggregate] <= @toRevision
        ORDER BY [revisionAggregate]`, (err?: Error): void => {
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

  public async getUnpublishedEventStream (): Promise<PassThrough> {
    const database = await SqlServerEventstore.getDatabase(this.pool);

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
      let event = EventExternal.deserialize(JSON.parse(columns[0].value));

      event = event.setRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      if (columns[2].value) {
        event = event.markAsPublished();
      }

      passThrough.write(event);
    };

    request = new Request(`
      SELECT [event], [revisionGlobal], [isPublished]
        FROM [${this.namespace}_events]
        WHERE [isPublished] = 0
        ORDER BY [revisionGlobal]
      `, (err?: Error): void => {
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

  public async saveEvents ({ uncommittedEvents }: {
    uncommittedEvents: EventInternal[];
  }): Promise<EventInternal[]> {
    if (uncommittedEvents.length === 0) {
      throw new Error('Uncommitted events are missing.');
    }

    const placeholders = [],
          values: Row[] = [];

    let resultCount = 0;

    for (const [ index, uncommittedEvent ] of uncommittedEvents.entries()) {
      if (!(uncommittedEvent instanceof EventInternal)) {
        throw new Error('Event must be internal.');
      }

      const rowId = index + 1;
      const row = [
        { key: `aggregateId${rowId}`, value: uncommittedEvent.aggregateIdentifier.id, type: TYPES.UniqueIdentifier, options: undefined },
        { key: `revisionAggregate${rowId}`, value: uncommittedEvent.metadata.revision.aggregate, type: TYPES.Int, options: undefined },
        { key: `event${rowId}`, value: JSON.stringify(uncommittedEvent.asExternal()), type: TYPES.NVarChar, options: { length: 4000 }},
        { key: `isPublished${rowId}`, value: uncommittedEvent.metadata.isPublished, type: TYPES.Bit, options: undefined }
      ];

      placeholders.push(`(@${row[0].key}, @${row[1].key}, @${row[2].key}, @${row[3].key})`);

      values.push(...row);
    }

    const database = await SqlServerEventstore.getDatabase(this.pool);

    const text = `
      INSERT INTO [${this.namespace}_events] ([aggregateId], [revisionAggregate], [event], [isPublished])
        OUTPUT INSERTED.[revisionGlobal]
      VALUES ${placeholders.join(',')};
    `;

    const committedEvents: EventInternal[] = [];

    try {
      await new Promise((resolve, reject): void => {
        let onRow: (columns: ColumnValue[]) => void;

        const request = new Request(text, (err?: Error): void => {
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
          const uncommittedEvent = uncommittedEvents[resultCount];
          const committedEvent = uncommittedEvent.setRevisionGlobal({
            revisionGlobal: Number(columns[0].value)
          });

          committedEvents.push(committedEvent);
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

    const indexForSnapshot = committedEvents.findIndex(
      (committedEvent): boolean => committedEvent.metadata.revision.aggregate % 100 === 0
    );

    if (indexForSnapshot !== -1) {
      const { aggregateIdentifier } = committedEvents[indexForSnapshot];
      const { aggregate: revisionAggregate } = committedEvents[indexForSnapshot].metadata.revision;
      const { state } = committedEvents[indexForSnapshot].annotations;

      await this.saveSnapshot({
        snapshot: { aggregateIdentifier, revision: revisionAggregate, state }
      });
    }

    return committedEvents;
  }

  public async markEventsAsPublished ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }): Promise<void> {
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    const database = await SqlServerEventstore.getDatabase(this.pool);

    try {
      await new Promise((resolve, reject): void => {
        const request = new Request(`
          UPDATE [${this.namespace}_events]
            SET [isPublished] = 1
            WHERE [aggregateId] = @aggregateId
              AND [revisionAggregate] >= @fromRevision
              AND [revisionAggregate] <= @toRevision
          `, (err?: Error): void => {
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
  }): Promise<Snapshot | undefined> {
    const database = await SqlServerEventstore.getDatabase(this.pool);

    try {
      const result: Snapshot | undefined = await new Promise((resolve, reject): void => {
        let resultRow: Snapshot;

        const request = new Request(`
          SELECT TOP(1) [state], [revisionAggregate]
            FROM ${this.namespace}_snapshots
            WHERE [aggregateId] = @aggregateId
            ORDER BY [revisionAggregate] DESC
          ;`, (err?: Error): void => {
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
    snapshot: Snapshot;
  }): Promise<void> {
    const filteredState = omitByDeep(
      snapshot.state,
      (value): boolean => value === undefined
    );

    const database = await SqlServerEventstore.getDatabase(this.pool);

    try {
      await new Promise((resolve, reject): void => {
        const request = new Request(`
          IF NOT EXISTS (SELECT TOP(1) * FROM ${this.namespace}_snapshots WHERE [aggregateId] = @aggregateId and [revisionAggregate] = @revisionAggregate)
            BEGIN
              INSERT INTO [${this.namespace}_snapshots] ([aggregateId], [revisionAggregate], [state])
              VALUES (@aggregateId, @revisionAggregate, @state);
            END
          `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, snapshot.aggregateIdentifier.id);
        request.addParameter('revisionAggregate', TYPES.Int, snapshot.revision);
        request.addParameter('state', TYPES.NVarChar, JSON.stringify(filteredState), { length: 4000 });

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

    const database = await SqlServerEventstore.getDatabase(this.pool);

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
      let event = EventExternal.deserialize(JSON.parse(columns[0].value));

      event = event.setRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      passThrough.write(event);
    };

    request = new Request(`
      SELECT [event], [revisionGlobal]
        FROM [${this.namespace}_events]
        WHERE [revisionGlobal] >= @fromRevisionGlobal
          AND [revisionGlobal] <= @toRevisionGlobal
        ORDER BY [revisionGlobal]`, (err?: Error): void => {
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

export default SqlServerEventstore;
