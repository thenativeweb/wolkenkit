import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { PassThrough } from 'stream';
import retry from 'async-retry';
import { runQuery } from '../../utils/mySql/runQuery';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';

class MySqlDomainEventStore implements DomainEventStore {
  protected tableNames: TableNames;

  protected pool: Pool;

  protected constructor ({ tableNames, pool }: {
    tableNames: TableNames;
    pool: Pool;
  }) {
    this.tableNames = tableNames;
    this.pool = pool;
  }

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected static releaseConnection ({ connection }: {
    connection: PoolConnection;
  }): void {
    (connection as any).removeListener('end', MySqlDomainEventStore.onUnexpectedClose);
    connection.release();
  }

  protected async getDatabase (): Promise<PoolConnection> {
    const database = await retry(async (): Promise<PoolConnection> => new Promise((resolve, reject): void => {
      this.pool.getConnection((err: MysqlError | null, poolConnection): void => {
        if (err) {
          reject(err);

          return;
        }
        resolve(poolConnection);
      });
    }));

    return database;
  }

  public static async create ({ hostname, port, username, password, database, tableNames }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    tableNames: TableNames;
  }): Promise<MySqlDomainEventStore> {
    const pool = createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });

    pool.on('connection', (connection: PoolConnection): void => {
      connection.on('error', (err: Error): never => {
        throw err;
      });
      connection.on('end', MySqlDomainEventStore.onUnexpectedClose);
    });

    const domainEventStore = new MySqlDomainEventStore({ tableNames, pool });
    const connection = await domainEventStore.getDatabase();

    const createUuidToBinFunction = `
      CREATE FUNCTION UuidToBin(_uuid BINARY(36))
        RETURNS BINARY(16)
        RETURN UNHEX(CONCAT(
          SUBSTR(_uuid, 15, 4),
          SUBSTR(_uuid, 10, 4),
          SUBSTR(_uuid, 1, 8),
          SUBSTR(_uuid, 20, 4),
          SUBSTR(_uuid, 25)
        ));
    `;

    try {
      await runQuery({ connection, query: createUuidToBinFunction });
    } catch (ex) {
      // If the function already exists, we can ignore this error; otherwise
      // rethrow it. Generally speaking, this should be done using a SQL clause
      // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
      // there is a ready-made function UUID_TO_BIN, but this is only available
      // from MySQL 8.0 upwards.
      if (!ex.message.includes('FUNCTION UuidToBin already exists')) {
        throw ex;
      }
    }

    const createUuidFromBinFunction = `
      CREATE FUNCTION UuidFromBin(_bin BINARY(16))
        RETURNS BINARY(36)
        RETURN LCASE(CONCAT_WS('-',
          HEX(SUBSTR(_bin,  5, 4)),
          HEX(SUBSTR(_bin,  3, 2)),
          HEX(SUBSTR(_bin,  1, 2)),
          HEX(SUBSTR(_bin,  9, 2)),
          HEX(SUBSTR(_bin, 11))
        ));
    `;

    try {
      await runQuery({ connection, query: createUuidFromBinFunction });
    } catch (ex) {
      // If the function already exists, we can ignore this error; otherwise
      // rethrow it. Generally speaking, this should be done using a SQL clause
      // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
      // there is a ready-made function BIN_TO_UUID, but this is only available
      // from MySQL 8.0 upwards.
      if (!ex.message.includes('FUNCTION UuidFromBin already exists')) {
        throw ex;
      }
    }

    const query = `
      CREATE TABLE IF NOT EXISTS ${tableNames.domainEvents} (
        revisionGlobal SERIAL,
        aggregateId BINARY(16) NOT NULL,
        revisionAggregate INT NOT NULL,
        domainEvent JSON NOT NULL,
        isPublished BOOLEAN NOT NULL,

        PRIMARY KEY(revisionGlobal),
        UNIQUE (aggregateId, revisionAggregate)
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS ${tableNames.snapshots} (
        aggregateId BINARY(16) NOT NULL,
        revisionAggregate INT NOT NULL,
        state JSON NOT NULL,

        PRIMARY KEY(aggregateId, revisionAggregate)
      ) ENGINE=InnoDB;
    `;

    await runQuery({ connection, query });

    MySqlDomainEventStore.releaseConnection({ connection });

    return domainEventStore;
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
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

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(`
      SELECT domainEvent, revisionGlobal, isPublished
        FROM ${this.tableNames.domainEvents}
        WHERE aggregateId = UuidToBin(?)
          AND revisionAggregate >= ?
          AND revisionAggregate <= ?
        ORDER BY revisionAggregate`,
    [ aggregateIdentifier.id, fromRevision, toRevision ]);

    const unsubscribe = function (): void {
      // The listeners on domainEventStream should be removed here, but the
      // mysql typings unfortunately don't support that.
      MySqlDomainEventStore.releaseConnection({ connection });
    };

    const onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };
    const onError = function (err: MysqlError): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };
    const onResult = function (row: any): void {
      let domainEvent = new DomainEvent<DomainEventData>(JSON.parse(row.domainEvent));

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(row.revisionGlobal)
      });

      if (row.isPublished) {
        domainEvent = domainEvent.asPublished();
      }

      passThrough.write(domainEvent);
    };

    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);
    domainEventStream.on('result', onResult);

    return passThrough;
  }

  public async getLastDomainEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<DomainEventData> | undefined> {
    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT domainEvent, revisionGlobal
          FROM ${this.tableNames.domainEvents}
          WHERE aggregateId = UuidToBin(?)
          ORDER BY revisionAggregate DESC
          LIMIT 1`,
        parameters: [ aggregateIdentifier.id ]
      });

      if (rows.length === 0) {
        return;
      }

      let domainEvent = new DomainEvent<DomainEventData>(JSON.parse(rows[0].domainEvent));

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(rows[0].revisionGlobal)
      });

      return domainEvent;
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
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

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(`
      SELECT domainEvent, revisionGlobal
        FROM ${this.tableNames.domainEvents}
        WHERE revisionGlobal >= ?
          AND revisionGlobal <= ?
        ORDER BY revisionGlobal
      `, [ fromRevisionGlobal, toRevisionGlobal ]);

    const unsubscribe = function (): void {
      // Listeners should be removed here, but the mysql typings don't support
      // that.
      MySqlDomainEventStore.releaseConnection({ connection });
    };

    const onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };
    const onError = function (err: MysqlError): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };
    const onResult = function (row: any): void {
      let domainEvent = new DomainEvent<DomainEventData>(JSON.parse(row.domainEvent));

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(row.revisionGlobal)
      });

      passThrough.write(domainEvent);
    };

    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);
    domainEventStream.on('result', onResult);

    return passThrough;
  }

  public async getSnapshot ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<State> | undefined> {
    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT state, revisionAggregate
          FROM ${this.tableNames.snapshots}
          WHERE aggregateId = UuidToBin(?)
          ORDER BY revisionAggregate DESC
          LIMIT 1`,
        parameters: [ aggregateIdentifier.id ]
      });

      if (rows.length === 0) {
        return;
      }

      return {
        aggregateIdentifier,
        revision: rows[0].revisionAggregate,
        state: JSON.parse(rows[0].state)
      };
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }
  }

  public async getUnpublishedDomainEventStream (): Promise<PassThrough> {
    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(`
      SELECT domainEvent, revisionGlobal, isPublished
        FROM ${this.tableNames.domainEvents}
        WHERE isPublished = false
        ORDER BY revisionGlobal
    `);

    const unsubscribe = function (): void {
      // Listeners should be removed here, but the mysql typings don't support
      // that.
      MySqlDomainEventStore.releaseConnection({ connection });
    };

    const onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };
    const onError = function (err: MysqlError): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };
    const onResult = function (row: any): void {
      let domainEvent = new DomainEvent<DomainEventData>(JSON.parse(row.domainEvent));

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(row.revisionGlobal)
      });

      if (row.isPublished) {
        domainEvent = domainEvent.asPublished();
      }

      passThrough.write(domainEvent);
    };

    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);
    domainEventStream.on('result', onResult);

    return passThrough;
  }

  public async markDomainEventsAsPublished ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }): Promise<void> {
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    const connection = await this.getDatabase();

    try {
      await runQuery({
        connection,
        query: `UPDATE ${this.tableNames.domainEvents}
          SET isPublished = true
          WHERE aggregateId = UuidToBin(?)
            AND revisionAggregate >= ?
            AND revisionAggregate <= ?`,
        parameters: [ aggregateIdentifier.id, fromRevision, toRevision ]
      });
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }
  }

  public async saveDomainEvents ({ domainEvents }: {
    domainEvents: DomainEvent<DomainEventData>[];
  }): Promise<DomainEvent<DomainEventData>[]> {
    if (domainEvents.length === 0) {
      throw new Error('Domain events are missing.');
    }

    const connection = await this.getDatabase();

    const parameters: any[] = [],
          placeholders = [];

    for (const domainEvent of domainEvents) {
      placeholders.push('(UuidToBin(?), ?, ?, ?)');
      parameters.push(
        domainEvent.aggregateIdentifier.id,
        domainEvent.metadata.revision.aggregate,
        JSON.stringify(domainEvent),
        domainEvent.metadata.isPublished
      );
    }

    const query = `
      INSERT INTO ${this.tableNames.domainEvents}
        (aggregateId, revisionAggregate, domainEvent, isPublished)
      VALUES
        ${placeholders.join(',')};
    `;

    const savedDomainEvents = [];

    try {
      await runQuery({ connection, query, parameters });

      const [ rows ] = await runQuery({
        connection,
        query: 'SELECT LAST_INSERT_ID() AS revisionGlobal;'
      });

      // We only get the ID of the first inserted row, but since it's all in a
      // single INSERT statement, the database guarantees that the global
      // revisions are sequential, so we easily calculate them by ourselves.
      for (const [ index, domainEvent ] of domainEvents.entries()) {
        const savedDomainEvent = domainEvent.withRevisionGlobal({
          revisionGlobal: Number(rows[0].revisionGlobal) + index
        });

        savedDomainEvents.push(savedDomainEvent);
      }
    } catch (ex) {
      if (ex.code === 'ER_DUP_ENTRY' && ex.sqlMessage.endsWith('for key \'aggregateId\'')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }

    return savedDomainEvents;
  }

  public async saveSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    const connection = await this.getDatabase();

    try {
      await runQuery({
        connection,
        query: `INSERT IGNORE INTO ${this.tableNames.snapshots}
          (aggregateId, revisionAggregate, state)
          VALUES (UuidToBin(?), ?, ?);`,
        parameters: [ snapshot.aggregateIdentifier.id, snapshot.revision, JSON.stringify(snapshot.state) ]
      });
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }
  }
}

export { MySqlDomainEventStore };
