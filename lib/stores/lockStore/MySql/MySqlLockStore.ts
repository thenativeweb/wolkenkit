import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { LockStore } from '../LockStore';
import { MySqlLockStoreOptions } from './MySqlLockStoreOptions';
import { retry } from 'retry-ignore-abort';
import { runQuery } from '../../utils/mySql/runQuery';
import { TableNames } from './TableNames';
import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';

class MySqlLockStore implements LockStore {
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
    (connection as any).removeListener('end', MySqlLockStore.onUnexpectedClose);
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
  }: MySqlLockStoreOptions): Promise<MySqlLockStore> {
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
      connection.on('end', MySqlLockStore.onUnexpectedClose);
    });

    return new MySqlLockStore({
      tableNames,
      pool
    });
  }

  protected async removeExpiredLocks ({ connection }: {
    connection: PoolConnection;
  }): Promise<void> {
    await runQuery({
      connection,
      query: `DELETE FROM \`${this.tableNames.locks}\` WHERE expiresAt < ?;`,
      parameters: [ Date.now() ]
    });
  }

  public async acquireLock ({ value, expiresAt = Number.MAX_SAFE_INTEGER }: {
    value: string;
    expiresAt?: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    const connection = await this.getDatabase();
    const hash = getHash({ value });

    try {
      // From time to time, we should removed expired locks. Doing this before
      // acquiring new ones is a good point in time for this.
      await this.removeExpiredLocks({ connection });

      try {
        await runQuery({
          connection,
          query: `
            INSERT INTO \`${this.tableNames.locks}\` (expiresAt, value)
              VALUES (?, ?);
          `,
          parameters: [ expiresAt, hash ]
        });
      } catch {
        throw new errors.LockAcquireFailed('Failed to acquire lock.');
      }
    } finally {
      MySqlLockStore.releaseConnection({ connection });
    }
  }

  public async isLocked ({ value }: {
    value: any;
  }): Promise<boolean> {
    const connection = await this.getDatabase();
    const hash = getHash({ value });

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `
          SELECT 1
            FROM \`${this.tableNames.locks}\`
            WHERE value = ? AND expiresAt >= ?;
        `,
        parameters: [ hash, Date.now() ]
      });

      if (rows.length === 0) {
        return false;
      }

      return true;
    } finally {
      MySqlLockStore.releaseConnection({ connection });
    }
  }

  public async renewLock ({ value, expiresAt }: {
    value: string;
    expiresAt: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    const connection = await this.getDatabase();
    const hash = getHash({ value });

    try {
      // From time to time, we should removed expired locks. Doing this before
      // renewing existing ones is a good point in time for this.
      await this.removeExpiredLocks({ connection });

      const [ rows ] = await runQuery({
        connection,
        query: `
          UPDATE \`${this.tableNames.locks}\`
            SET expiresAt = ?
            WHERE value = ?;
        `,
        parameters: [ expiresAt, hash ]
      });

      if (rows.changedRows === 0) {
        throw new errors.LockRenewalFailed('Failed to renew lock.');
      }
    } finally {
      MySqlLockStore.releaseConnection({ connection });
    }
  }

  public async releaseLock ({ value }: {
    value: string;
  }): Promise<void> {
    const connection = await this.getDatabase();
    const hash = getHash({ value });

    try {
      // From time to time, we should removed expired locks. Doing this before
      // releasing existing ones is a good point in time for this.
      await this.removeExpiredLocks({ connection });

      await runQuery({
        connection,
        query: `
          DELETE FROM \`${this.tableNames.locks}\`
            WHERE value = ?;
        `,
        parameters: [ hash ]
      });
    } finally {
      MySqlLockStore.releaseConnection({ connection });
    }
  }

  public async setup (): Promise<void> {
    const connection = await this.getDatabase();

    await runQuery({
      connection,
      query: `
        CREATE TABLE IF NOT EXISTS \`${this.tableNames.locks}\` (
          value CHAR(64) NOT NULL,
          expiresAt BIGINT NOT NULL,

          PRIMARY KEY(value)
        );
      `
    });

    MySqlLockStore.releaseConnection({ connection });
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
  }
}

export { MySqlLockStore };
