import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import EventExternal from '../../../common/elements/EventExternal';
import EventInternal from '../../../common/elements/EventInternal';
import { Eventstore } from '../Eventstore';
import mysql from 'mysql';
import { query as mysqlQuery } from '../../utils/mysql/query';
import omitByDeep from '../../../common/utils/omitByDeep';
import { PassThrough } from 'stream';
import retry from 'async-retry';
import { Snapshot } from '../Snapshot';

class MySqlEventstore implements Eventstore {
  protected namespace: string;

  protected pool: mysql.Pool;

  protected constructor ({ namespace, pool }: {
    namespace: string;
    pool: mysql.Pool;
  }) {
    this.namespace = namespace;
    this.pool = pool;
  }

  public static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected async getDatabase (): Promise<mysql.PoolConnection> {
    const database = await retry(async (): Promise<mysql.PoolConnection> => new Promise((resolve, reject): void => {
      this.pool.getConnection((err: null | mysql.MysqlError, poolConnection: mysql.PoolConnection): void => {
        if (err) {
          reject(err);

          return;
        }
        resolve(poolConnection);
      });
    }));

    return database;
  }

  public static async create ({ hostname, port, username, password, database, namespace }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    namespace: string;
  }): Promise<MySqlEventstore> {
    const prefixedNamespace = `store_${namespace.replace(/[\W_]/ug, '')}`;

    const pool = mysql.createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });

    pool.on('connection', (connection: mysql.PoolConnection): void => {
      connection.on('error', (err: Error): never => {
        throw err;
      });
      connection.on('end', MySqlEventstore.onUnexpectedClose);
    });

    const eventstore = new MySqlEventstore({ namespace: prefixedNamespace, pool });

    const connection = await eventstore.getDatabase();

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
      await mysqlQuery(connection, createUuidToBinFunction);
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
      await mysqlQuery(connection, createUuidFromBinFunction);
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
      CREATE TABLE IF NOT EXISTS ${prefixedNamespace}_events (
        revisionGlobal SERIAL,
        aggregateId BINARY(16) NOT NULL,
        revisionAggregate INT NOT NULL,
        event JSON NOT NULL,
        isPublished BOOLEAN NOT NULL,

        PRIMARY KEY(revisionGlobal),
        UNIQUE (aggregateId, revisionAggregate)
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS ${prefixedNamespace}_snapshots (
        aggregateId BINARY(16) NOT NULL,
        revisionAggregate INT NOT NULL,
        state JSON NOT NULL,

        PRIMARY KEY(aggregateId, revisionAggregate)
      ) ENGINE=InnoDB;
    `;

    await mysqlQuery(connection, query);

    connection.release();

    return eventstore;
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
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

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.query(`
      SELECT event, revisionGlobal, isPublished
        FROM ${this.namespace}_events
        WHERE aggregateId = UuidToBin(?)
          AND revisionAggregate >= ?
          AND revisionAggregate <= ?
        ORDER BY revisionAggregate`,
    [ aggregateIdentifier, fromRevision, toRevision ]);

    const unsubscribe = function (): void {
      // Listeners should be removed here, but the mysql typing don't allow that.
      connection.release();
    };

    const onEnd = function (): void {
            unsubscribe();
            passThrough.end();
          },
          onError = function (err: mysql.MysqlError): void {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
          },
          onResult = function (row: any): void {
            let event = EventExternal.deserialize(row.event);

            event = event.setRevisionGlobal({
              revisionGlobal: Number(row.revisionGlobal)
            });

            if (row.isPublished) {
              event = event.markAsPublished();
            }

            passThrough.write(event);
          };

    eventStream.on('end', onEnd);
    eventStream.on('error', onError);
    eventStream.on('result', onResult);

    return passThrough;
  }

  public async getLastEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<EventExternal | undefined> {
    const connection = await this.getDatabase();

    try {
      const [ rows ] = await mysqlQuery(
        connection,
        `SELECT event, revisionGlobal
          FROM ${this.namespace}_events
          WHERE aggregateId = UuidToBin(?)
          ORDER BY revisionAggregate DESC
          LIMIT 1`,
        [ aggregateIdentifier ]
      );

      if (rows.length === 0) {
        return;
      }

      let event = EventExternal.deserialize(rows[0].event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(rows[0].revisionGlobal)
      });

      return event;
    } finally {
      connection.release();
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
    const eventStream = connection.query(`
      SELECT event, revisionGlobal
        FROM ${this.namespace}_events
        WHERE revisionGlobal >= ?
          AND revisionGlobal <= ?
        ORDER BY revisionGlobal
      `, [ fromRevisionGlobal, toRevisionGlobal ]);

    const unsubscribe = function (): void {
      // Listeners should be removed here, but the mysql typing don't allow that.
      connection.release();
    };

    const onEnd = function (): void {
            unsubscribe();
            passThrough.end();
          },
          onError = function (err: mysql.MysqlError): void {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
          },
          onResult = function (row: any): void {
            let event = EventExternal.deserialize(row.event);

            event = event.setRevisionGlobal({
              revisionGlobal: Number(row.revisionGlobal)
            });

            passThrough.write(event);
          };

    eventStream.on('end', onEnd);
    eventStream.on('error', onError);
    eventStream.on('result', onResult);

    return passThrough;
  }

  public async getSnapshot ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot | undefined> {
    const connection = await this.getDatabase();

    try {
      const [ rows ] = await mysqlQuery(
        connection,
        `SELECT state, revisionAggregate
          FROM ${this.namespace}_snapshots
          WHERE aggregateId = UuidToBin(?)
          ORDER BY revisionAggregate DESC
          LIMIT 1`,
        [ aggregateIdentifier ]
      );

      if (rows.length === 0) {
        return;
      }

      return {
        aggregateIdentifier,
        revision: rows[0].revisionAggregate,
        state: rows[0].state
      };
    } finally {
      connection.release();
    }
  }

  public async getUnpublishedEventStream (): Promise<PassThrough> {
    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.query(`
      SELECT event, revisionGlobal, isPublished
        FROM ${this.namespace}_events
        WHERE isPublished = false
        ORDER BY revisionGlobal
    `);

    const unsubscribe = function (): void {
      // Listeners should be removed here, but the mysql typing don't allow that.
      connection.release();
    };

    const onEnd = function (): void {
            unsubscribe();
            passThrough.end();
          },
          onError = function (err: mysql.MysqlError): void {
            unsubscribe();
            passThrough.emit('error', err);
            passThrough.end();
          },
          onResult = function (row: any): void {
            let event = EventExternal.deserialize(row.event);

            event = event.setRevisionGlobal({
              revisionGlobal: Number(row.revisionGlobal)
            });

            if (row.isPublished) {
              event = event.markAsPublished();
            }

            passThrough.write(event);
          };

    eventStream.on('end', onEnd);
    eventStream.on('error', onError);
    eventStream.on('result', onResult);

    return passThrough;
  }

  public async markEventsAsPublished ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }): Promise<void> {
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    const connection = await this.getDatabase();

    try {
      await mysqlQuery(
        connection,
        `UPDATE ${this.namespace}_events
          SET isPublished = true
          WHERE aggregateId = UuidToBin(?)
            AND revisionAggregate >= ?
            AND revisionAggregate <= ?`,
        [ aggregateIdentifier, fromRevision, toRevision ]
      );
    } finally {
      connection.release();
    }
  }

  public async saveEvents ({ uncommittedEvents }: {
    uncommittedEvents: EventInternal[];
  }): Promise<EventInternal[]> {
    if (uncommittedEvents.length === 0) {
      throw new Error('Uncommitted events are missing.');
    }

    const connection = await this.getDatabase();

    const placeholders = [],
          values: any[] = [];

    for (const uncommittedEvent of uncommittedEvents) {
      if (!(uncommittedEvent instanceof EventInternal)) {
        throw new Error('Event must be internal.');
      }

      placeholders.push('(UuidToBin(?), ?, ?, ?)');
      values.push(
        uncommittedEvent.aggregateIdentifier,
        uncommittedEvent.metadata.revision.aggregate,
        JSON.stringify(uncommittedEvent.asExternal()),
        uncommittedEvent.metadata.isPublished
      );
    }

    const text = `
      INSERT INTO ${this.namespace}_events
        (aggregateId, revisionAggregate, event, isPublished)
      VALUES
        ${placeholders.join(',')};
    `;

    const committedEvents = [];

    try {
      await mysqlQuery(connection, text, values);

      const rows = await mysqlQuery(connection, 'SELECT LAST_INSERT_ID() AS revisionGlobal;');

      // We only get the ID of the first inserted row, but since it's all in a
      // single INSERT statement, the database guarantees that the global
      // revisions are sequential, so we easily calculate them by ourselves.
      for (const [ index, uncommittedEvent ] of uncommittedEvents.entries()) {
        const committedEvent = uncommittedEvent.setRevisionGlobal({
          revisionGlobal: Number(rows[0].revisionGlobal) + index
        });

        committedEvents.push(committedEvent);
      }
    } catch (ex) {
      if (ex.code === 'ER_DUP_ENTRY' && ex.sqlMessage.endsWith('for key \'aggregateId\'')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      connection.release();
    }

    const indexForSnapshot = committedEvents.findIndex(
      (committedEvent): boolean => committedEvent.metadata.revision.aggregate % 100 === 0
    );

    if (indexForSnapshot !== -1) {
      const { aggregateIdentifier } = committedEvents[indexForSnapshot];
      const { aggregate: revisionAggregate } = committedEvents[indexForSnapshot].metadata.revision;
      const { state } = committedEvents[indexForSnapshot].annotations;

      await this.saveSnapshot({ snapshot: { aggregateIdentifier, revision: revisionAggregate, state }});
    }

    return committedEvents;
  }

  public async saveSnapshot ({ snapshot }: {
    snapshot: Snapshot;
  }): Promise<void> {
    const filteredState = omitByDeep(snapshot.state, (value): boolean => value === undefined);

    const connection = await this.getDatabase();

    try {
      await mysqlQuery(
        connection,
        `INSERT IGNORE INTO ${this.namespace}_snapshots
          (aggregateId, revisionAggregate, state)
          VALUES (UuidToBin(?), ?, ?);`,
        [ snapshot.aggregateIdentifier, snapshot.revision, JSON.stringify(filteredState) ]
      );
    } finally {
      connection.release();
    }
  }
}

module.exports = MySqlEventstore;
