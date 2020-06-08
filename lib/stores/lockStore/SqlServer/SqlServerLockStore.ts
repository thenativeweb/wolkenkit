import { errors } from '../errors';
import { getHash } from '../getHash';
import { LockStore } from '../LockStore';
import { TableNames } from './TableNames';
import { ConnectionPool, TYPES as Types } from 'mssql';

class SqlServerLockStore implements LockStore {
  protected pool: ConnectionPool;

  protected tableNames: TableNames;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected constructor ({ pool, tableNames }: {
    pool: ConnectionPool;
    tableNames: TableNames;
  }) {
    this.pool = pool;
    this.tableNames = tableNames;
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
  }): Promise<SqlServerLockStore> {
    const pool = new ConnectionPool({
      server: hostName,
      port,
      user: userName,
      password,
      database,
      options: {
        enableArithAbort: true,
        encrypt: encryptConnection,
        trustServerCertificate: false
      }
    });

    pool.on('error', (): void => {
      SqlServerLockStore.onUnexpectedClose();
    });

    await pool.connect();

    try {
      await pool.query(`
        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${tableNames.locks}')
          BEGIN
            CREATE TABLE [${tableNames.locks}] (
              [value] NCHAR(64) NOT NULL,
              [expiresAt] BIGINT NOT NULL,

              CONSTRAINT [${tableNames.locks}_pk] PRIMARY KEY([value])
            );
          END
      `);
    } catch (ex) {
      if (!/There is already an object named.*_locks/u.exec(ex.message)) {
        throw ex;
      }

      // When multiple clients initialize at the same time, e.g. during
      // integration tests, SQL Server might throw an error. In this case we
      // simply ignore it.
    }

    return new SqlServerLockStore({ pool, tableNames });
  }

  protected async removeExpiredLocks (): Promise<void> {
    const requestDelete = this.pool.request();

    requestDelete.input('now', Types.BigInt, Date.now());

    await requestDelete.query(`
      DELETE FROM [${this.tableNames.locks}] WHERE [expiresAt] < @now;
    `);
  }

  public async acquireLock ({ value, expiresAt = Number.MAX_SAFE_INTEGER }: {
    value: string;
    expiresAt?: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    // From time to time, we should removed expired locks. Doing this before
    // acquiring new ones is a good point in time for this.
    await this.removeExpiredLocks();

    const request = this.pool.request();
    const hash = getHash({ value });

    request.input('hash', Types.NChar, hash);
    request.input('expiresAt', Types.BigInt, expiresAt);

    try {
      await request.query(`
        INSERT INTO [${this.tableNames.locks}] ([value], [expiresAt])
          VALUES (@hash, @expiresAt);
      `);
    } catch {
      throw new errors.AcquireLockFailed('Failed to acquire lock.');
    }
  }

  public async isLocked ({ value }: {
    value: string;
  }): Promise<boolean> {
    const request = this.pool.request();
    const hash = getHash({ value });

    request.input('hash', Types.NChar, hash);
    request.input('now', Types.BigInt, Date.now());

    const { recordset } = await request.query(`
      SELECT 1
        FROM [${this.tableNames.locks}]
        WHERE [value] = @hash AND [expiresAt] >= @now;
    `);

    if (recordset.length === 0) {
      return false;
    }

    return true;
  }

  public async renewLock ({ value, expiresAt }: {
    value: string;
    expiresAt: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    // From time to time, we should removed expired locks. Doing this before
    // renewing existing ones is a good point in time for this.
    await this.removeExpiredLocks();

    const request = this.pool.request();
    const hash = getHash({ value });

    request.input('hash', Types.NChar, hash);
    request.input('now', Types.BigInt, Date.now());
    request.input('expiresAt', Types.BigInt, expiresAt);

    const { rowsAffected } = await request.query(`
      UPDATE [${this.tableNames.locks}]
        SET [expiresAt] = @expiresAt
        WHERE [value] = @hash;
    `);

    if (rowsAffected[0] === 0) {
      throw new errors.RenewLockFailed('Failed to renew lock.');
    }
  }

  public async releaseLock ({ value }: {
    value: any;
  }): Promise<void> {
    // From time to time, we should removed expired locks. Doing this before
    // releasing existing ones is a good point in time for this.
    await this.removeExpiredLocks();

    const request = this.pool.request();
    const hash = getHash({ value });

    request.input('hash', Types.NChar, hash);
    request.input('now', Types.BigInt, Date.now());

    await request.query(`
      DELETE [${this.tableNames.locks}]
        WHERE [value] = @hash;
    `);
  }

  public async destroy (): Promise<void> {
    await this.pool.close();
  }
}

export { SqlServerLockStore };
