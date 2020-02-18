import { createPool } from '../../utils/sqlServer/createPool';
import { errors } from '../errors';
import { LockStore } from '../LockStore';
import { sqlServer as maxDate } from '../../../common/utils/maxDate';
import { Pool } from 'tarn';
import { retry } from 'retry-ignore-abort';
import { TableNames } from './TableNames';
import { Connection, Request, TYPES } from 'tedious';

class SqlServerLockStore implements LockStore {
  protected pool: Pool<Connection>;

  protected tableNames: TableNames;

  protected nonce: string | null;

  protected maxLockSize: number;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected static async getDatabase (pool: Pool<Connection>): Promise<Connection> {
    const database = await retry(async (): Promise<Connection> => {
      const connection = await pool.acquire().promise;

      return connection;
    });

    return database;
  }

  protected constructor ({ pool, tableNames, nonce, maxLockSize }: {
    pool: Pool<Connection>;
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
    const pool = createPool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      encrypt: encryptConnection,

      onError (err): never {
        throw err;
      },

      onDisconnect (): void {
        SqlServerLockStore.onUnexpectedClose();
      }
    });

    const connection = await SqlServerLockStore.getDatabase(pool);

    const query = `
      BEGIN TRANSACTION setupTable;

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${tableNames.locks}')
        BEGIN
          CREATE TABLE [${tableNames.locks}] (
            [name] VARCHAR(${maxLockSize}) NOT NULL,
            [expiresAt] BIGINT NOT NULL,
            [nonce] NVARCHAR(64),

            CONSTRAINT [${tableNames.locks}_pk] PRIMARY KEY([name])
          );
        END

      COMMIT TRANSACTION setupTable;
    `;

    await new Promise((resolve, reject): void => {
      const request = new Request(query, (err?: Error): void => {
        if (err) {
          // When multiple clients initialize at the same time, e.g. during
          // integration tests, SQL Server might throw an error. In this case
          // we simply ignore it.
          if (/There is already an object named.*_locks/u.exec(err.message)) {
            return resolve();
          }

          return reject(err);
        }

        resolve();
      });

      connection.execSql(request);
    });

    pool.release(connection);

    return new SqlServerLockStore({
      pool,
      tableNames,
      nonce,
      maxLockSize
    });
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

    const database = await SqlServerLockStore.getDatabase(this.pool);

    try {
      await new Promise((resolve, reject): void => {
        let lockResult: { expiresAt: Date };

        const request = new Request(`
          DELETE FROM [${this.tableNames.locks}] WHERE [expiresAt] < @now;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('now', TYPES.BigInt, Date.now());

        request.once('row', (columns): void => {
          lockResult = {
            expiresAt: columns[0].value
          };
        });

        database.execSql(request);
      });

      try {
        await new Promise((resolve, reject): void => {
          const request = new Request(
            `INSERT INTO [${this.tableNames.locks}] ([name], [expiresAt], [nonce])
            VALUES (@name, @expiresAt, @nonce)
          ;`,
            (err?: Error): void => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );

          request.addParameter('name', TYPES.NVarChar, name);
          request.addParameter('expiresAt', TYPES.BigInt, expiresAt);
          request.addParameter('nonce', TYPES.NVarChar, this.nonce);

          database.execSql(request);
        });
      } catch {
        throw new errors.AcquireLockFailed('Failed to acquire lock.');
      }
    } finally {
      this.pool.release(database);
    }
  }

  public async isLocked ({ name }: {
    name: any;
  }): Promise<boolean> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const database = await SqlServerLockStore.getDatabase(this.pool);

    let isLocked = false;

    try {
      const result: { expiresAt: number } | undefined = await new Promise((resolve, reject): void => {
        let lockResult: { expiresAt: number };

        const request = new Request(`
          SELECT TOP(1) [expiresAt]
            FROM [${this.tableNames.locks}]
            WHERE [name] = @name
          ;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('name', TYPES.NVarChar, name);

        request.once('row', (columns): void => {
          lockResult = {
            expiresAt: columns[0].value
          };
        });

        database.execSql(request);
      });

      if (result) {
        isLocked = result.expiresAt > Date.now();
      }
    } finally {
      this.pool.release(database);
    }

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

    const database = await SqlServerLockStore.getDatabase(this.pool);

    try {
      const result: { expiresAt: number; nonce: string | null } | undefined = await new Promise((resolve, reject): void => {
        let lockResult: { expiresAt: number; nonce: string | null };

        const request = new Request(`
          SELECT TOP(1) [expiresAt], [nonce]
            FROM [${this.tableNames.locks}]
            WHERE [name] = @name
          ;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('name', TYPES.NVarChar, name);

        request.once('row', (columns): void => {
          lockResult = {
            expiresAt: columns[0].value,
            nonce: columns[1].value
          };
        });

        database.execSql(request);
      });

      if (!result) {
        throw new errors.RenewLockFailed('Failed to renew lock.');
      }
      if (result.expiresAt < Date.now() || this.nonce !== result.nonce) {
        throw new errors.RenewLockFailed('Failed to renew lock.');
      }

      await new Promise((resolve, reject): void => {
        const request = new Request(`
        UPDATE [${this.tableNames.locks}]
           SET [expiresAt] = @expiresAt
         WHERE [name] = @name
         ;`, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('name', TYPES.NVarChar, name);
        request.addParameter('expiresAt', TYPES.BigInt, expiresAt);

        database.execSql(request);
      });
    } finally {
      this.pool.release(database);
    }
  }

  public async releaseLock ({ name }: {
    name: any;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const database = await SqlServerLockStore.getDatabase(this.pool);

    try {
      const result: { expiresAt: number; nonce: string | null } | undefined = await new Promise((resolve, reject): void => {
        let lockResult: { expiresAt: number; nonce: string | null };

        const request = new Request(`
          SELECT TOP(1) [expiresAt], [nonce]
            FROM [${this.tableNames.locks}]
            WHERE [name] = @name
          ;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('name', TYPES.NVarChar, name);

        request.once('row', (columns): void => {
          lockResult = {
            expiresAt: columns[0].value,
            nonce: columns[1].value
          };
        });

        database.execSql(request);
      });

      if (!result) {
        return;
      }

      if (Date.now() < result.expiresAt && this.nonce !== result.nonce) {
        throw new errors.ReleaseLockFailed('Failed to release lock.');
      }

      await new Promise((resolve, reject): void => {
        const request = new Request(`
          DELETE FROM [${this.tableNames.locks}]
           WHERE [name] = @name
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('name', TYPES.NVarChar, name);

        database.execSql(request);
      });
    } finally {
      this.pool.release(database);
    }
  }

  public async destroy (): Promise<void> {
    await this.pool.destroy();
  }
}

export { SqlServerLockStore };
