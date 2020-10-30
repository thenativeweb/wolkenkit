import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { errors } from '../../../common/errors';
import { MySqlDomainEventStoreOptions } from './MySqlDomainEventStoreOptions';
import { retry } from 'retry-ignore-abort';
import { runQuery } from '../../utils/mySql/runQuery';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';
import { PassThrough, Readable } from 'stream';

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

  public static async create ({
    hostName,
    port,
    userName,
    password,
    database,
    tableNames
  }: MySqlDomainEventStoreOptions): Promise<MySqlDomainEventStore> {
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

      connection.on('end', MySqlDomainEventStore.onUnexpectedClose);
    });

    return new MySqlDomainEventStore({ tableNames, pool });
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT domainEvent
          FROM \`${this.tableNames.domainEvents}\`
          WHERE aggregateId = UuidToBin(?)
          ORDER BY revision DESC
          LIMIT 1`,
        parameters: [ aggregateIdentifier.id ]
      });

      if (rows.length === 0) {
        return;
      }

      const domainEvent = new DomainEvent<TDomainEventData>(JSON.parse(rows[0].domainEvent));

      return domainEvent;
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getDomainEventsByCausationId <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    const connection = await this.getDatabase();

    const domainEventStream = connection.query(
      `SELECT domainEvent
          FROM \`${this.tableNames.domainEvents}\`
          WHERE causationId = UuidToBin(?)`,
      [ causationId ]
    );
    const passThrough = new PassThrough({ objectMode: true });

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
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(row.domainEvent));

      passThrough.write(domainEvent);
    };

    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);
    domainEventStream.on('result', onResult);

    return passThrough;
  }

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT 1
          FROM \`${this.tableNames.domainEvents}\`
          WHERE causationId = UuidToBin(?)`,
        parameters: [ causationId ]
      });

      return rows.length !== 0;
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getDomainEventsByCorrelationId <TDomainEventData extends DomainEventData> ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    const connection = await this.getDatabase();

    const domainEventStream = connection.query(
      `SELECT domainEvent
          FROM \`${this.tableNames.domainEvents}\`
          WHERE correlationId = UuidToBin(?)`,
      [ correlationId ]
    );
    const passThrough = new PassThrough({ objectMode: true });

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
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(row.domainEvent));

      passThrough.write(domainEvent);
    };

    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);
    domainEventStream.on('result', onResult);

    return passThrough;
  }

  public async getReplay ({ fromTimestamp = 0 }: {
    fromTimestamp?: number;
  } = {}): Promise<Readable> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
    }

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(`
      SELECT domainEvent
        FROM \`${this.tableNames.domainEvents}\`
        WHERE timestamp >= ?
        ORDER BY aggregateId ASC, revision ASC
      `, [ fromTimestamp ]);

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
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(row.domainEvent));

      passThrough.write(domainEvent);
    };

    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);
    domainEventStream.on('result', onResult);

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

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(`
      SELECT domainEvent
        FROM \`${this.tableNames.domainEvents}\`
        WHERE aggregateId = UuidToBin(?)
          AND revision >= ?
          AND revision <= ?
        ORDER BY revision`,
    [ aggregateId, fromRevision, toRevision ]);

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
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(row.domainEvent));

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
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT state, revision
          FROM \`${this.tableNames.snapshots}\`
          WHERE aggregateId = UuidToBin(?)
          ORDER BY revision DESC
          LIMIT 1`,
        parameters: [ aggregateIdentifier.id ]
      });

      if (rows.length === 0) {
        return;
      }

      return {
        aggregateIdentifier,
        revision: rows[0].revision,
        state: JSON.parse(rows[0].state)
      };
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }
  }

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<void> {
    if (domainEvents.length === 0) {
      throw new errors.ParameterInvalid('Domain events are missing.');
    }

    const connection = await this.getDatabase();

    const parameters: any[] = [],
          placeholders = [];

    for (const domainEvent of domainEvents) {
      placeholders.push('(UuidToBin(?), ?, UuidToBin(?), UuidToBin(?), ?, ?)');
      parameters.push(
        domainEvent.aggregateIdentifier.id,
        domainEvent.metadata.revision,
        domainEvent.metadata.causationId,
        domainEvent.metadata.correlationId,
        domainEvent.metadata.timestamp,
        JSON.stringify(domainEvent)
      );
    }

    const query = `
      INSERT INTO \`${this.tableNames.domainEvents}\`
        (aggregateId, revision, causationId, correlationId, timestamp, domainEvent)
      VALUES
        ${placeholders.join(',')};
    `;

    try {
      await runQuery({ connection, query, parameters });
    } catch (ex: unknown) {
      if ((ex as MysqlError).code === 'ER_DUP_ENTRY' && (ex as MysqlError).sqlMessage?.endsWith('for key \'PRIMARY\'')) {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }
  }

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    const connection = await this.getDatabase();

    try {
      await runQuery({
        connection,
        query: `INSERT IGNORE INTO \`${this.tableNames.snapshots}\`
          (aggregateId, revision, state)
          VALUES (UuidToBin(?), ?, ?);`,
        parameters: [
          snapshot.aggregateIdentifier.id,
          snapshot.revision,
          JSON.stringify(snapshot.state)
        ]
      });
    } finally {
      MySqlDomainEventStore.releaseConnection({ connection });
    }
  }

  public async setup (): Promise<void> {
    const connection = await this.getDatabase();

    const createUuidToBinFunction = `
      CREATE FUNCTION UuidToBin(_uuid CHAR(36))
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
    } catch (ex: unknown) {
      // If the function already exists, we can ignore this error; otherwise
      // rethrow it. Generally speaking, this should be done using a SQL clause
      // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
      // there is a ready-made function UUID_TO_BIN, but this is only available
      // from MySQL 8.0 upwards.
      if (!(ex as Error).message.includes('FUNCTION UuidToBin already exists')) {
        throw ex;
      }
    }

    const createUuidFromBinFunction = `
      CREATE FUNCTION UuidFromBin(_bin BINARY(16))
        RETURNS CHAR(36)
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
    } catch (ex: unknown) {
      // If the function already exists, we can ignore this error; otherwise
      // rethrow it. Generally speaking, this should be done using a SQL clause
      // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
      // there is a ready-made function BIN_TO_UUID, but this is only available
      // from MySQL 8.0 upwards.
      if (!(ex as Error).message.includes('FUNCTION UuidFromBin already exists')) {
        throw ex;
      }
    }

    const query = `
      CREATE TABLE IF NOT EXISTS \`${this.tableNames.domainEvents}\` (
        aggregateId BINARY(16) NOT NULL,
        revision INT NOT NULL,
        causationId BINARY(16) NOT NULL,
        correlationId BINARY(16) NOT NULL,
        timestamp BIGINT NOT NULL,
        domainEvent JSON NOT NULL,

        PRIMARY KEY (aggregateId, revision),
        INDEX (causationId),
        INDEX (correlationId),
        INDEX (timestamp)
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`${this.tableNames.snapshots}\` (
        aggregateId BINARY(16) NOT NULL,
        revision INT NOT NULL,
        state JSON NOT NULL,

        PRIMARY KEY (aggregateId, revision)
      ) ENGINE=InnoDB;
    `;

    await runQuery({ connection, query });

    MySqlDomainEventStore.releaseConnection({ connection });
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
  }
}

export { MySqlDomainEventStore };
