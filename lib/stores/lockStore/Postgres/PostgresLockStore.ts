import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { LockStore } from '../LockStore';
import { PostgresLockStoreOptions } from './PostgresLockStoreOptions';
import { retry } from 'retry-ignore-abort';
import { TableNames } from './TableNames';
import { Client, Pool, PoolClient } from 'pg';

class PostgresLockStore implements LockStore {
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
    encryptConnection,
    tableNames
  }: PostgresLockStoreOptions): Promise<PostgresLockStore> {
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

    disconnectWatcher.on('end', PostgresLockStore.onUnexpectedClose);
    disconnectWatcher.on('error', (err: Error): never => {
      throw err;
    });

    await disconnectWatcher.connect();

    return new PostgresLockStore({
      tableNames,
      pool,
      disconnectWatcher
    });
  }

  protected async removeExpiredLocks ({ connection }: {
    connection: PoolClient;
  }): Promise<void> {
    await connection.query({
      name: 'delete expired locks',
      text: `DELETE FROM "${this.tableNames.locks}" WHERE "expiresAt" < $1`,
      values: [ Date.now() ]
    });
  }

  public async acquireLock ({ value, expiresAt = Number.MAX_SAFE_INTEGER }: {
    value: string;
    expiresAt?: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    const connection = await PostgresLockStore.getDatabase(this.pool);
    const hash = getHash({ value });

    try {
      // From time to time, we should removed expired locks. Doing this before
      // acquiring new ones is a good point in time for this.
      await this.removeExpiredLocks({ connection });

      try {
        await connection.query({
          name: `try to acquire lock`,
          text: `
            INSERT INTO "${this.tableNames.locks}" ("value", "expiresAt")
              VALUES ($1, $2)
          `,
          values: [ hash, expiresAt ]
        });
      } catch {
        throw new errors.LockAcquireFailed('Failed to acquire lock.');
      }
    } finally {
      connection.release();
    }
  }

  public async isLocked ({ value }: {
    value: string;
  }): Promise<boolean> {
    const connection = await PostgresLockStore.getDatabase(this.pool);
    const hash = getHash({ value });

    try {
      const result = await connection.query({
        name: 'get lock',
        text: `
          SELECT 1
            FROM "${this.tableNames.locks}"
            WHERE "value" = $1 AND "expiresAt" >= $2
        `,
        values: [ hash, Date.now() ]
      });

      if (result.rows.length === 0) {
        return false;
      }

      return true;
    } finally {
      connection.release();
    }
  }

  public async renewLock ({ value, expiresAt }: {
    value: string;
    expiresAt: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    const connection = await PostgresLockStore.getDatabase(this.pool);
    const hash = getHash({ value });

    try {
      // From time to time, we should removed expired locks. Doing this before
      // renewing existing ones is a good point in time for this.
      await this.removeExpiredLocks({ connection });

      const result = await connection.query({
        name: 'renew lock',
        text: `
          UPDATE "${this.tableNames.locks}"
            SET "expiresAt" = $2
            WHERE "value" = $1
        `,
        values: [ hash, expiresAt ]
      });

      if (result.rowCount === 0) {
        throw new errors.LockRenewalFailed('Failed to renew lock.');
      }
    } finally {
      connection.release();
    }
  }

  public async releaseLock ({ value }: {
    value: string;
  }): Promise<void> {
    const connection = await PostgresLockStore.getDatabase(this.pool);
    const hash = getHash({ value });

    try {
      // From time to time, we should removed expired locks. Doing this before
      // releasing existing ones is a good point in time for this.
      await this.removeExpiredLocks({ connection });

      await connection.query({
        name: 'remove lock',
        text: `
          DELETE FROM "${this.tableNames.locks}"
            WHERE "value" = $1
        `,
        values: [ hash ]
      });
    } finally {
      connection.release();
    }
  }

  public async setup (): Promise<void> {
    const connection = await PostgresLockStore.getDatabase(this.pool);

    try {
      await retry(async (): Promise<void> => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${this.tableNames.locks}" (
            "value" CHAR(64) NOT NULL,
            "expiresAt" BIGINT NOT NULL,

            CONSTRAINT "${this.tableNames.locks}_pk" PRIMARY KEY("value")
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
  }

  public async destroy (): Promise<void> {
    this.disconnectWatcher.removeListener('end', PostgresLockStore.onUnexpectedClose);
    await this.disconnectWatcher.end();
    await this.pool.end();
  }
}

export { PostgresLockStore };
