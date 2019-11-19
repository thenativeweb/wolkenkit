import { createPool } from '../../utils/sqlServer/createPool';
import { LockStore } from '../LockStore';
import { sqlServer as maxDate } from '../../../common/utils/maxDate';
import { noop } from 'lodash';
import { Pool } from 'tarn';
import retry from 'async-retry';
import { sortKeys } from '../../../common/utils/sortKeys';
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

    const lockstore = new SqlServerLockStore({
      pool,
      tableNames,
      nonce,
      maxLockSize
    });

    const connection = await SqlServerLockStore.getDatabase(pool);

    const query = `
      BEGIN TRANSACTION setupTable;

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${tableNames.locks}')
        BEGIN
          CREATE TABLE [${tableNames.locks}] (
            [namespace] NVARCHAR(64) NOT NULL,
            [value] VARCHAR(${maxLockSize}) NOT NULL,
            [expiresAt] DATETIME2(3) NOT NULL,
            [nonce] NVARCHAR(64),

            CONSTRAINT [${tableNames.locks}_pk] PRIMARY KEY([namespace], [value])
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

    return lockstore;
  }

  public async acquireLock ({
    namespace,
    value,
    expiresAt = maxDate,
    onAcquired = noop
  }: {
    namespace: string;
    value: any;
    expiresAt?: number;
    onAcquired? (): void | Promise<void>;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const database = await SqlServerLockStore.getDatabase(this.pool);

    try {
      const result: { expiresAt: Date } | undefined = await new Promise((resolve, reject): void => {
        let lockResult: { expiresAt: Date };

        const request = new Request(`
          SELECT TOP(1) [expiresAt]
            FROM ${this.tableNames.locks}
            WHERE [namespace] = @namespace
              AND [value] = @value
          ;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

        request.once('row', (columns): void => {
          lockResult = {
            expiresAt: columns[0].value
          };
        });

        database.execSql(request);
      });

      let newEntry = true;

      if (result) {
        const isLocked = result.expiresAt.getTime() > Date.now();

        if (isLocked) {
          throw new Error('Failed to acquire lock.');
        }

        newEntry = false;
      }

      let query: string;

      if (newEntry) {
        query = `
          INSERT INTO [${this.tableNames.locks}] ([namespace], [value], [expiresAt], [nonce])
          VALUES (@namespace, @value, @expiresAt, @nonce)
          ;`;
      } else {
        query = `
        UPDATE [${this.tableNames.locks}]
           SET [expiresAt] = @expiresAt,
               [nonce] = @nonce
         WHERE [namespace] = @namespace
           AND [value] = @value
         ;`;
      }

      await new Promise((resolve, reject): void => {
        const request = new Request(query, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);
        request.addParameter('expiresAt', TYPES.DateTime2, new Date(expiresAt), { precision: 3 });
        request.addParameter('nonce', TYPES.NVarChar, this.nonce);

        database.execSql(request);
      });

      try {
        await onAcquired();
      } catch (ex) {
        await this.releaseLock({ namespace, value });

        throw ex;
      }
    } finally {
      this.pool.release(database);
    }
  }

  public async isLocked ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<boolean> {
    const sortedSerializedValue = JSON.stringify(sortKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const database = await SqlServerLockStore.getDatabase(this.pool);

    let isLocked = false;

    try {
      const result: { expiresAt: Date } | undefined = await new Promise((resolve, reject): void => {
        let lockResult: { expiresAt: Date };

        const request = new Request(`
          SELECT TOP(1) [expiresAt]
            FROM ${this.tableNames.locks}
            WHERE [namespace] = @namespace
              AND [value] = @value
          ;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

        request.once('row', (columns): void => {
          lockResult = {
            expiresAt: columns[0].value
          };
        });

        database.execSql(request);
      });

      if (result) {
        isLocked = result.expiresAt.getTime() > Date.now();
      }
    } finally {
      this.pool.release(database);
    }

    return isLocked;
  }

  public async renewLock ({ namespace, value, expiresAt }: {
    namespace: string;
    value: any;
    expiresAt: number;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const database = await SqlServerLockStore.getDatabase(this.pool);

    try {
      const result: { expiresAt: Date; nonce: string | null } | undefined = await new Promise((resolve, reject): void => {
        let lockResult: { expiresAt: Date; nonce: string | null };

        const request = new Request(`
          SELECT TOP(1) [expiresAt], [nonce]
            FROM ${this.tableNames.locks}
            WHERE [namespace] = @namespace
              AND [value] = @value
          ;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

        request.once('row', (columns): void => {
          lockResult = {
            expiresAt: columns[0].value,
            nonce: columns[1].value
          };
        });

        database.execSql(request);
      });

      if (!result) {
        throw new Error('Failed to renew lock.');
      }
      if (result.expiresAt.getTime() < Date.now() || this.nonce !== result.nonce) {
        throw new Error('Failed to renew lock.');
      }

      await new Promise((resolve, reject): void => {
        const request = new Request(`
        UPDATE [${this.tableNames.locks}]
           SET [expiresAt] = @expiresAt
         WHERE [namespace] = @namespace
           AND [value] = @value
         ;`, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);
        request.addParameter('expiresAt', TYPES.DateTime2, new Date(expiresAt), { precision: 3 });

        database.execSql(request);
      });
    } finally {
      this.pool.release(database);
    }
  }

  public async releaseLock ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const database = await SqlServerLockStore.getDatabase(this.pool);

    try {
      const result: { expiresAt: Date; nonce: string | null } | undefined = await new Promise((resolve, reject): void => {
        let lockResult: { expiresAt: Date; nonce: string | null };

        const request = new Request(`
          SELECT TOP(1) [expiresAt], [nonce]
            FROM ${this.tableNames.locks}
            WHERE [namespace] = @namespace
              AND [value] = @value
          ;
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

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

      if (Date.now() < result.expiresAt.getTime() && this.nonce !== result.nonce) {
        throw new Error('Failed to release lock.');
      }

      await new Promise((resolve, reject): void => {
        const request = new Request(`
          DELETE FROM [${this.tableNames.locks}]
           WHERE [namespace] = @namespace
             AND [value] = @value
        `, (err?: Error): void => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

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
