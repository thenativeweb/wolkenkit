import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { IsReplaying } from '../IsReplaying';
import { retry } from 'retry-ignore-abort';
import { TableNames } from './TableNames';
import { withTransaction } from '../../utils/postgres/withTransaction';
import { Client, Pool, PoolClient } from 'pg';

class PostgresConsumerProgressStore implements ConsumerProgressStore {
  protected tableNames: TableNames;

  protected pool: Pool;

  protected disconnectWatcher: Client;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected static async getDatabase (pool: Pool): Promise<PoolClient> {
    const database = await retry(async (): Promise<PoolClient> => {
      const connection = await pool.connect();

      return connection;
    });

    return database;
  }

  protected constructor ({ tableNames, pool, disconnectWatcher }: {
    tableNames: TableNames;
    pool: Pool;
    disconnectWatcher: Client;
  }) {
    this.tableNames = tableNames;
    this.pool = pool;
    this.disconnectWatcher = disconnectWatcher;
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
  }): Promise<PostgresConsumerProgressStore> {
    const pool = new Pool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      ssl: encryptConnection
    });

    pool.on('error', (err: Error): never => {
      throw err;
    });

    const disconnectWatcher = new Client({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      ssl: encryptConnection
    });

    disconnectWatcher.on('end', PostgresConsumerProgressStore.onUnexpectedClose);
    disconnectWatcher.on('error', (err: Error): never => {
      throw err;
    });

    await new Promise((resolve, reject): void => {
      try {
        disconnectWatcher.connect(resolve);
      } catch (ex) {
        reject(ex);
      }
    });

    const lockStore = new PostgresConsumerProgressStore({
      tableNames,
      pool,
      disconnectWatcher
    });

    const connection = await PostgresConsumerProgressStore.getDatabase(pool);

    try {
      await retry(async (): Promise<void> => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${tableNames.progress}" (
            "consumerId" CHAR(64) NOT NULL,
            "aggregateId" uuid NOT NULL,
            "revision" integer NOT NULL,
            "isReplayingFrom" integer,
            "isReplayingTo" integer,

            CONSTRAINT "${tableNames.progress}_pk" PRIMARY KEY("consumerId", "aggregateId")
          );
        `);
      }, {
        retries: 3,
        minTimeout: 100,
        factor: 1
      });
    } finally {
      connection.release();
    }

    return lockStore;
  }

  public async getProgress ({ consumerId, aggregateIdentifier }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<{ revision: number; isReplaying: IsReplaying }> {
    const connection = await PostgresConsumerProgressStore.getDatabase(this.pool);
    const hash = getHash({ value: consumerId });

    try {
      const { rows } = await connection.query({
        name: 'get progress',
        text: `
          SELECT "revision", "isReplayingFrom", "isReplayingTo"
            FROM "${this.tableNames.progress}"
            WHERE "consumerId" = $1 AND "aggregateId" = $2;
        `,
        values: [ hash, aggregateIdentifier.id ]
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
      connection.release();
    }
  }

  public async setProgress ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    const hash = getHash({ value: consumerId });

    await withTransaction({
      getConnection: async (): Promise<PoolClient> => await PostgresConsumerProgressStore.getDatabase(this.pool),
      fn: async ({ connection }): Promise<void> => {
        const { rowCount } = await connection.query({
          name: 'update progress',
          text: `
            UPDATE "${this.tableNames.progress}"
              SET "revision" = $1
              WHERE "consumerId" = $2 AND "aggregateId" = $3 AND "revision" < $4;
          `,
          values: [ revision, hash, aggregateIdentifier.id, revision ]
        });

        if (rowCount === 1) {
          return;
        }

        try {
          await connection.query({
            name: 'insert progress with default is replaying',
            text: `
              INSERT INTO "${this.tableNames.progress}"
                ("consumerId", "aggregateId", "revision")
                VALUES ($1, $2, $3);
            `,
            values: [ hash, aggregateIdentifier.id, revision ]
          });
        } catch (ex) {
          if (ex.code === '23505' && ex.detail.startsWith('Key ("consumerId", "aggregateId")')) {
            throw new errors.RevisionTooLow();
          }

          throw ex;
        }
      },
      async releaseConnection ({ connection }): Promise<void> {
        connection.release();
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
      getConnection: async (): Promise<PoolClient> => await PostgresConsumerProgressStore.getDatabase(this.pool),
      fn: async ({ connection }): Promise<void> => {
        let rowCount: any;

        if (!isReplaying) {
          ({ rowCount } = await connection.query({
            name: 'update is replaying to false',
            text: `
            UPDATE "${this.tableNames.progress}"
              SET "isReplayingFrom" = NULL, "isReplayingTo" = NULL
              WHERE "consumerId" = $1 AND "aggregateId" = $2;
          `,
            values: [ hash, aggregateIdentifier.id ]
          }));
        } else {
          ({ rowCount } = await connection.query({
            name: 'update is replaying to values',
            text: `
            UPDATE "${this.tableNames.progress}"
              SET "isReplayingFrom" = $1, "isReplayingTo" = $2
              WHERE "consumerId" = $3 AND "aggregateId" = $4 AND "isReplayingFrom" IS NULL AND "isReplayingTo" IS NULL;
          `,
            values: [ isReplaying.from, isReplaying.to, hash, aggregateIdentifier.id ]
          }));
        }

        if (rowCount === 1) {
          return;
        }

        try {
          await connection.query({
            name: 'insert progress with default revision',
            text: `
              INSERT INTO "${this.tableNames.progress}"
                ("consumerId", "aggregateId", "revision", "isReplayingFrom", "isReplayingTo")
                VALUES ($1, $2, 0, $3, $4);
            `,
            values: [ hash, aggregateIdentifier.id, isReplaying ? isReplaying.from : null, isReplaying ? isReplaying.to : null ]
          });
        } catch (ex) {
          if (ex.code === '23505' && ex.detail.startsWith('Key ("consumerId", "aggregateId")')) {
            throw new errors.FlowIsAlreadyReplaying();
          }

          throw ex;
        }
      },
      async releaseConnection ({ connection }): Promise<void> {
        connection.release();
      }
    });
  }

  public async resetProgress ({ consumerId }: {
    consumerId: string;
  }): Promise<void> {
    const connection = await PostgresConsumerProgressStore.getDatabase(this.pool);
    const hash = getHash({ value: consumerId });

    try {
      await connection.query({
        name: 'reset progress',
        text: `
          DELETE FROM "${this.tableNames.progress}"
            WHERE "consumerId" = $1
        `,
        values: [ hash ]
      });
    } finally {
      connection.release();
    }
  }

  public async destroy (): Promise<void> {
    this.disconnectWatcher.removeListener('end', PostgresConsumerProgressStore.onUnexpectedClose);
    await this.disconnectWatcher.end();
    await this.pool.end();
  }
}

export { PostgresConsumerProgressStore };
