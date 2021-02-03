import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { IsReplaying } from '../IsReplaying';
import { MySqlConsumerProgressStoreOptions } from './MySqlConsumerProgressStoreOptions';
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
  }: MySqlConsumerProgressStoreOptions): Promise<MySqlConsumerProgressStore> {
    const pool = createPool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });

    pool.on('connection', (connection: PoolConnection): void => {
      connection.on('error', (err: Error): never => {
        throw err;
      });
      connection.on('end', MySqlConsumerProgressStore.onUnexpectedClose);
    });

    return new MySqlConsumerProgressStore({
      tableNames,
      pool
    });
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
        parameters: [ hash, aggregateIdentifier.aggregate.id ]
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

    if (revision < 0) {
      throw new errors.ParameterInvalid('Revision must be at least zero.');
    }

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
          parameters: [ revision, hash, aggregateIdentifier.aggregate.id, revision ]
        });

        if (rows.affectedRows === 1) {
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
            parameters: [ hash, aggregateIdentifier.aggregate.id, revision ]
          });
        } catch (ex: unknown) {
          if ((ex as MysqlError).code === 'ER_DUP_ENTRY' && (ex as MysqlError).sqlMessage?.endsWith('for key \'PRIMARY\'')) {
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
    if (isReplaying) {
      if (isReplaying.from < 1) {
        throw new errors.ParameterInvalid('Replays must start from at least one.');
      }
      if (isReplaying.from > isReplaying.to) {
        throw new errors.ParameterInvalid('Replays must start at an earlier revision than where they end at.');
      }
    }

    const hash = getHash({ value: consumerId });

    await withTransaction({
      getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
      fn: async ({ connection }): Promise<void> => {
        let rows: any;

        if (!isReplaying) {
          [ rows ] = await runQuery({
            connection,
            query: `
            UPDATE \`${this.tableNames.progress}\`
              SET isReplayingFrom = NULL, isReplayingTo = NULL
              WHERE consumerId = ? AND aggregateId = UuidToBin(?);
          `,
            parameters: [ hash, aggregateIdentifier.aggregate.id ]
          });
        } else {
          [ rows ] = await runQuery({
            connection,
            query: `
            UPDATE \`${this.tableNames.progress}\`
              SET isReplayingFrom = ?, isReplayingTo = ?
              WHERE consumerId = ? AND aggregateId = UuidToBin(?) AND isReplayingFrom IS NULL AND isReplayingTo IS NULL;
          `,
            parameters: [ isReplaying.from, isReplaying.to, hash, aggregateIdentifier.aggregate.id ]
          });
        }

        if (rows.affectedRows === 1) {
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
            parameters: [ hash, aggregateIdentifier.aggregate.id, isReplaying ? isReplaying.from : null, isReplaying ? isReplaying.to : null ]
          });
        } catch (ex: unknown) {
          if ((ex as MysqlError).code === 'ER_DUP_ENTRY' && (ex as MysqlError).sqlMessage?.endsWith('for key \'PRIMARY\'')) {
            throw new errors.FlowIsAlreadyReplaying();
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

  public async resetProgressToRevision ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    if (revision < 0) {
      throw new errors.ParameterInvalid('Revision must be at least zero.');
    }

    const { revision: currentRevision } = await this.getProgress({
      consumerId,
      aggregateIdentifier
    });

    if (currentRevision < revision) {
      throw new errors.ParameterInvalid('Can not reset a consumer to a newer revision than it currently is at.');
    }

    const hash = getHash({ value: consumerId });

    await withTransaction({
      getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
      fn: async ({ connection }): Promise<void> => {
        const [ rows ] = await runQuery({
          connection,
          query: `
            UPDATE \`${this.tableNames.progress}\`
              SET revision = ?, isReplayingFrom = NULL, isReplayingTo = NULL
              WHERE consumerId = ? AND aggregateId = UuidToBin(?);
          `,
          parameters: [ revision, hash, aggregateIdentifier.aggregate.id, revision ]
        });

        if (rows.affectedRows === 1) {
          return;
        }

        await runQuery({
          connection,
          query: `
              INSERT INTO \`${this.tableNames.progress}\`
                (consumerId, aggregateId, revision)
                VALUES (?, UuidToBin(?), ?);
            `,
          parameters: [ hash, aggregateIdentifier.aggregate.id, revision ]
        });
      },
      async releaseConnection ({ connection }): Promise<void> {
        MySqlConsumerProgressStore.releaseConnection({ connection });
      }
    });
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

    await runQuery({
      connection,
      query: `
        CREATE TABLE IF NOT EXISTS \`${this.tableNames.progress}\` (
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
  }

  public async destroy (): Promise<void> {
    await new Promise<void>((resolve, reject): void => {
      this.pool.end((err: MysqlError | null): void => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}

export { MySqlConsumerProgressStore };
