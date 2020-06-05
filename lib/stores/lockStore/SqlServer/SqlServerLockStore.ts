import { errors } from '../errors';
import { LockStore } from '../LockStore';
import { sqlServer as maxDate } from '../../../common/utils/maxDate';
import { TableNames } from './TableNames';
import { ConnectionPool, TYPES as Types } from 'mssql';

class SqlServerLockStore implements LockStore {
  protected pool: ConnectionPool;

  protected tableNames: TableNames;

  protected nonce: string | null;

  protected maxLockSize: number;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected constructor ({ pool, tableNames, nonce, maxLockSize }: {
    pool: ConnectionPool;
    tableNames: TableNames;
    nonce: string | null;
    maxLockSize: number;
  }) {
    this.pool = pool;
    this.tableNames = tableNames;
    this.nonce = nonce;
    this.maxLockSize = maxLockSize;
  }

  public static async create ({
    hostName,
    port,
    userName,
    password,
    database,
    encryptConnection = false,
    tableNames,
    nonce = null,
    maxLockSize = 828
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
    nonce?: string | null;
    maxLockSize?: number;
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
              [name] VARCHAR(${maxLockSize}) NOT NULL,
              [expiresAt] BIGINT NOT NULL,
              [nonce] NVARCHAR(64),

              CONSTRAINT [${tableNames.locks}_pk] PRIMARY KEY([name])
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

    return new SqlServerLockStore({ pool, tableNames, nonce, maxLockSize });
  }

  public async acquireLock ({
    name,
    expiresAt = maxDate
  }: {
    name: any;
    expiresAt?: number;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }
    if (expiresAt - Date.now() < 0) {
      throw new errors.ExpirationInPast('Cannot acquire a lock in the past.');
    }

    const requestDelete = this.pool.request();

    requestDelete.input('now', Types.BigInt, Date.now());

    await requestDelete.query(`
      DELETE FROM [${this.tableNames.locks}] WHERE [expiresAt] < @now;
    `);

    const requestInsert = this.pool.request();

    requestInsert.input('name', Types.NVarChar, name);
    requestInsert.input('expiresAt', Types.BigInt, expiresAt);
    requestInsert.input('nonce', Types.NVarChar, this.nonce);

    try {
      await requestInsert.query(`
        INSERT INTO [${this.tableNames.locks}] ([name], [expiresAt], [nonce])
          VALUES (@name, @expiresAt, @nonce);
      `);
    } catch {
      throw new errors.AcquireLockFailed('Failed to acquire lock.');
    }
  }

  public async isLocked ({ name }: {
    name: any;
  }): Promise<boolean> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const request = this.pool.request();

    request.input('name', Types.NVarChar, name);

    const { recordset } = await request.query(`
      SELECT TOP(1) [expiresAt]
        FROM [${this.tableNames.locks}]
        WHERE [name] = @name;
    `);

    if (recordset.length === 0) {
      return false;
    }

    const isLocked = recordset[0].expiresAt > Date.now();

    return isLocked;
  }

  public async renewLock ({ name, expiresAt }: {
    name: any;
    expiresAt: number;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }
    if (expiresAt - Date.now() < 0) {
      throw new errors.ExpirationInPast('Cannot acquire a lock in the past.');
    }

    const request = this.pool.request();

    request.input('name', Types.NVarChar, name);
    request.input('nonce', Types.NVarChar, this.nonce);
    request.input('now', Types.BigInt, Date.now());

    const { rowsAffected } = await request.query(`
      UPDATE [${this.tableNames.locks}]
        SET [expiresAt] = @expiresAt
        WHERE [name] = @name AND [nonce] = @nonce AND [expiresAt] >= @now;
    `);

    if (rowsAffected[0] === 0) {
      throw new errors.RenewLockFailed('Failed to renew lock.');
    }
  }

  public async releaseLock ({ name }: {
    name: any;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const request = this.pool.request();

    request.input('name', Types.NVarChar, name);
    request.input('nonce', Types.NVarChar, this.nonce);
    request.input('now', Types.BigInt, Date.now());

    const { rowsAffected } = await request.query(`
      DELETE [${this.tableNames.locks}]
        WHERE [name] = @name AND [nonce] = @nonce AND [expiresAt] >= @now;
    `);

    if (rowsAffected[0] === 0) {
      throw new errors.RenewLockFailed('Failed to release lock.');
    }
  }

  public async destroy (): Promise<void> {
    await this.pool.close();
  }
}

export { SqlServerLockStore };
