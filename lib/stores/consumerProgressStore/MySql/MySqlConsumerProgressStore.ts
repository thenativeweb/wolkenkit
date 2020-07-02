import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { IsReplaying } from '../IsReplaying';
import { retry } from 'retry-ignore-abort';
import { runQuery } from '../../utils/mySql/runQuery';
import { TableNames } from './TableNames';
import { withTransaction } from '../../utils/mySql/withTransaction';
import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';

class MySqlConsumerProgressStore implements ConsumerProgressStore {
  protected pool: Pool;

  protected tableNames: TableNames;

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
    (connection as any).removeListener('end', MySqlConsumerProgressStore.onUnexpectedClose);
    connection.release();
  }

  protected async getDatabase (): Promise<PoolConnection> {
    const database = await retry(async (): Promise<PoolConnection> => new Promise((resolve, reject): void => {
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
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    tableNames: TableNames;
  }): Promise<MySqlConsumerProgressStore> {
    const pool = createPool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true,
      flags: [ 'CLIENT_FOUND_ROWS' ]
    });

    pool.on('connection', (connection: PoolConnection): void => {
      connection.on('error', (err: Error): never => {
        throw err;
      });
      connection.on('end', MySqlConsumerProgressStore.onUnexpectedClose);
    });

    const lockStore = new MySqlConsumerProgressStore({
      tableNames,
      pool
    });

    const connection = await lockStore.getDatabase();

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

    await runQuery({
      connection,
      query: `
        CREATE TABLE IF NOT EXISTS \`${tableNames.progress}\` (
          consumerId CHAR(64) NOT NULL,
          aggregateId BINARY(16) NOT NULL,
          revision INT NOT NULL,
          isReplayingFrom INT,
          isReplayingTo INT,

          PRIMARY KEY(consumerId, aggregateId)
        );
      `
    });

    MySqlConsumerProgressStore.releaseConnection({ connection });

    return lockStore;
  }

  public async getProgress ({ consumerId, aggregateIdentifier }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<{ revision: number; isReplaying: IsReplaying }> {
    const connection = await this.getDatabase();
    const hash = getHash({ value: consumerId });

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `
          SELECT revision, isReplayingFrom, isReplayingTo
            FROM \`${this.tableNames.progress}\`
            WHERE consumerId = ? AND aggregateId = UuidToBin(?);
        `,
        parameters: [ hash, aggregateIdentifier.id ]
      });

      if (rows.length === 0) {
        return { revision: 0, isReplaying: false };
      }

      let isReplaying: IsReplaying = false;

      if (rows[0].isReplayingFrom && rows[0].isReplayingTo) {
        isReplaying = { from: rows[0].isReplayingFrom, to: rows[0].isReplayingTo };
      }

      return { revision: rows[0].revision, isReplaying };
    } finally {
      MySqlConsumerProgressStore.releaseConnection({ connection });
    }
  }

  public async setProgress ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    const hash = getHash({ value: consumerId });

    await withTransaction({
      getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
      fn: async ({ connection }): Promise<void> => {
        const [ rows ] = await runQuery({
          connection,
          query: `
            UPDATE \`${this.tableNames.progress}\`
              SET revision = ?
              WHERE consumerId = ? AND aggregateId = UuidToBin(?) AND revision < ?;
          `,
          parameters: [ revision, hash, aggregateIdentifier.id, revision ]
        });

        if (rows.changedRows === 1) {
          return;
        }

        try {
          await runQuery({
            connection,
            query: `
              INSERT INTO \`${this.tableNames.progress}\`
                (consumerId, aggregateId, revision)
                VALUES (?, UuidToBin(?), ?);
            `,
            parameters: [ hash, aggregateIdentifier.id, revision ]
          });
        } catch (ex) {
          if (ex.code === 'ER_DUP_ENTRY' && ex.sqlMessage.endsWith('for key \'PRIMARY\'')) {
            throw new errors.RevisionTooLow();
          }

          throw ex;
        }
      },
      async releaseConnection ({ connection }): Promise<void> {
        MySqlConsumerProgressStore.releaseConnection({ connection });
      }
    });
  }

  public async setIsReplaying ({ consumerId, aggregateIdentifier, isReplaying }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    isReplaying: IsReplaying;
  }): Promise<void> {
    const hash = getHash({ value: consumerId });

    await withTransaction({
      getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
      fn: async ({ connection }): Promise<void> => {
        let rows: any;

        if (isReplaying === false) {
          [ rows ] = await runQuery({
            connection,
            query: `
            UPDATE \`${this.tableNames.progress}\`
              SET isReplayingFrom = NULL, isReplayingTo = NULL
              WHERE consumerId = ? AND aggregateId = UuidToBin(?);
          `,
            parameters: [ hash, aggregateIdentifier.id ]
          });
        } else {
          [ rows ] = await runQuery({
            connection,
            query: `
            UPDATE \`${this.tableNames.progress}\`
              SET isReplayingFrom = ?, isReplayingTo = ?
              WHERE consumerId = ? AND aggregateId = UuidToBin(?) AND isReplayingFrom IS NULL AND isReplayingTo IS NULL;
          `,
            parameters: [ isReplaying.from, isReplaying.to, hash, aggregateIdentifier.id ]
          });
        }

        if (rows.changedRows === 1) {
          return;
        }

        try {
          await runQuery({
            connection,
            query: `
              INSERT INTO \`${this.tableNames.progress}\`
                (consumerId, aggregateId, revision, isReplayingFrom, isReplayingTo)
                VALUES (?, UuidToBin(?), 0, ?, ?);
            `,
            parameters: [ hash, aggregateIdentifier.id, isReplaying ? isReplaying.from : null, isReplaying ? isReplaying.to : null ]
          });
        } catch (ex) {
          if (ex.code === 'ER_DUP_ENTRY' && ex.sqlMessage.endsWith('for key \'PRIMARY\'')) {
            throw new errors.RevisionTooLow();
          }

          throw ex;
        }
      },
      async releaseConnection ({ connection }): Promise<void> {
        MySqlConsumerProgressStore.releaseConnection({ connection });
      }
    });
  }

  public async resetProgress ({ consumerId }: {
    consumerId: string;
  }): Promise<void> {
    const connection = await this.getDatabase();
    const hash = getHash({ value: consumerId });

    try {
      await runQuery({
        connection,
        query: `
          DELETE FROM \`${this.tableNames.progress}\`
            WHERE consumerId = ?;
        `,
        parameters: [ hash ]
      });
    } finally {
      MySqlConsumerProgressStore.releaseConnection({ connection });
    }
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
  }
}

export { MySqlConsumerProgressStore };
