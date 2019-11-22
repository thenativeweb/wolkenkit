import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { omitDeepBy } from '../../../common/utils/omitDeepBy';
import { PassThrough } from 'stream';
import retry from 'async-retry';
import { runQuery } from '../../utils/mySql/runQuery';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';

class MariaDbDomainEventStore implements DomainEventStore {
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
    (connection as any).removeListener('end', MariaDbDomainEventStore.onUnexpectedClose);
    connection.release();
  }

  protected async getDatabase (): Promise<PoolConnection> {
    const database = await retry(async (): Promise<PoolConnection> =>
      new Promise((resolve, reject): void => {
        this.pool.getConnection((err: MysqlError | null, poolConnection): void => {
          if (err) {
            return reject(err);
          }

          resolve(poolConnection);
        });
      }));

    return database;
  }

  public static async create ({ hostName, port, userName, password, database, tableNames }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    tableNames: TableNames;
  }): Promise<MariaDbDomainEventStore> {
    const pool = createPool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });

    pool.on('connection', (connection): void => {
      connection.on('error', (err): never => {
        throw err;
      });

      connection.on('end', MariaDbDomainEventStore.onUnexpectedClose);
    });

    const domainEventStore = new MariaDbDomainEventStore({ tableNames, pool });
    const connection = await domainEventStore.getDatabase();

    const query = `
      CREATE FUNCTION IF NOT EXISTS UuidToBin(_uuid BINARY(36))
        RETURNS BINARY(16)
        RETURN UNHEX(CONCAT(
          SUBSTR(_uuid, 15, 4),
          SUBSTR(_uuid, 10, 4),
          SUBSTR(_uuid, 1, 8),
          SUBSTR(_uuid, 20, 4),
          SUBSTR(_uuid, 25)
        ));

      CREATE FUNCTION IF NOT EXISTS UuidFromBin(_bin BINARY(16))
        RETURNS BINARY(36)
        RETURN LCASE(CONCAT_WS('-',
          HEX(SUBSTR(_bin,  5, 4)),
          HEX(SUBSTR(_bin,  3, 2)),
          HEX(SUBSTR(_bin,  1, 2)),
          HEX(SUBSTR(_bin,  9, 2)),
          HEX(SUBSTR(_bin, 11))
        ));

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

    MariaDbDomainEventStore.releaseConnection({ connection });

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
      // Listeners should be removed here, but the mysql typings don't support
      // that.
      MariaDbDomainEventStore.releaseConnection({ connection });
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
      let domainEvent = new DomainEvent<State>(JSON.parse(row.domainEvent));

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

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const connection = await this.getDatabase();

    try {
      const [ rows ]: any[] = await runQuery({
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

      let domainEvent = new DomainEvent<TDomainEventData>(JSON.parse(rows[0].domainEvent));

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(rows[0].revisionGlobal)
      });

      return domainEvent;
    } finally {
      MariaDbDomainEventStore.releaseConnection({ connection });
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
      MariaDbDomainEventStore.releaseConnection({ connection });
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
      let domainEvent = new DomainEvent<State>(JSON.parse(row.domainEvent));

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

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const connection = await this.getDatabase();

    try {
      const [ rows ]: any[] = await runQuery({
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
      MariaDbDomainEventStore.releaseConnection({ connection });
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
      MariaDbDomainEventStore.releaseConnection({ connection });
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
      let domainEvent = new DomainEvent<State>(JSON.parse(row.domainEvent));

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
      MariaDbDomainEventStore.releaseConnection({ connection });
    }
  }

  public async saveDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<DomainEvent<TDomainEventData>[]> {
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

      const [ rows ]: any[] = await runQuery({
        connection,
        query: 'SELECT LAST_INSERT_ID() AS revisionGlobal;'
      });

      // We only get the ID of the first inserted row, but since it's all in a
      // single INSERT statement, the database guarantees that the global
      // revisions are sequential, so we easily calculate them by ourselves.
      for (const [ index, domainEvent ] of domainEvents.entries()) {
        const savedDomainEvent = new DomainEvent<TDomainEventData>({
          ...domainEvent.withRevisionGlobal({
            revisionGlobal: Number(rows[0].revisionGlobal) + index
          }),
          data: omitDeepBy(domainEvent.data, (value): boolean => value === undefined)
        });

        savedDomainEvents.push(savedDomainEvent);
      }
    } catch (ex) {
      if (ex.code === 'ER_DUP_ENTRY' && ex.sqlMessage.endsWith('for key \'aggregateId\'')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      MariaDbDomainEventStore.releaseConnection({ connection });
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
        parameters: [
          snapshot.aggregateIdentifier.id,
          snapshot.revision,
          JSON.stringify(snapshot.state)
        ]
      });
    } finally {
      MariaDbDomainEventStore.releaseConnection({ connection });
    }
  }
}

export { MariaDbDomainEventStore };
