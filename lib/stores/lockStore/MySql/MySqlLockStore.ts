import { errors } from '../errors';
import { LockStore } from '../LockStore';
import { mySql as maxDate } from '../../../common/utils/maxDate';
import { retry } from 'retry-ignore-abort';
import { runQuery } from '../../utils/mySql/runQuery';
import { TableNames } from './TableNames';
import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';

class MySqlLockStore implements LockStore {
  protected pool: Pool;

  protected nonce: null | string;

  protected maxLockSize: number;

  protected tableNames: TableNames;

  protected constructor ({ tableNames, pool, nonce, maxLockSize }: {
    tableNames: TableNames;
    pool: Pool;
    nonce: null | string;
    maxLockSize: number;
  }) {
    this.tableNames = tableNames;
    this.pool = pool;
    this.nonce = nonce;
    this.maxLockSize = maxLockSize;
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
          reject(err);

          return;
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
    tableNames,
    nonce = null,
    maxLockSize = 2048
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    tableNames: TableNames;
    nonce?: null | string;
    maxLockSize?: number;
  }): Promise<MySqlLockStore> {
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

    const eventstore = new MySqlLockStore({
      tableNames,
      pool,
      nonce,
      maxLockSize
    });

    const connection = await eventstore.getDatabase();

    await runQuery({
      connection,
      query: `CREATE TABLE IF NOT EXISTS \`${tableNames.locks}\` (
        name VARCHAR(${maxLockSize}) NOT NULL,
        expiresAt BIGINT NOT NULL,
        nonce VARCHAR(64),

        PRIMARY KEY(name)
      );`
    });

    MySqlLockStore.releaseConnection({ connection });

    return eventstore;
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

    const connection = await this.getDatabase();

    try {
      await runQuery({
        connection,
        query: `DELETE FROM \`${this.tableNames.locks}\` WHERE expiresAt < ?;`,
        parameters: [ Date.now() ]
      });

      try {
        await runQuery({
          connection,
          query: ` INSERT INTO \`${this.tableNames.locks}\` (expiresAt, nonce, name)
            VALUES (?, ?, ?);`,
          parameters: [ expiresAt, this.nonce, name ]
        });
      } catch {
        throw new errors.AcquireLockFailed('Failed to acquire lock.');
      }
    } finally {
      MySqlLockStore.releaseConnection({ connection });
    }
  }

  public async isLocked ({ name }: {
    name: any;
  }): Promise<boolean> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const connection = await this.getDatabase();

    let isLocked = false;

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT expiresAt
          FROM \`${this.tableNames.locks}\`
         WHERE name = ?;`,
        parameters: [ name ]
      });

      if (rows.length > 0) {
        const [ entry ] = rows;

        isLocked = Date.now() < entry.expiresAt;
      }
    } finally {
      MySqlLockStore.releaseConnection({ connection });
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

    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT expiresAt, nonce
          FROM \`${this.tableNames.locks}\`
         WHERE name = ?;`,
        parameters: [ name ]
      });

      if (rows.length === 0) {
        throw new errors.RenewLockFailed('Failed to renew lock.');
      }

      const [ entry ] = rows;

      if (entry.expiresAt < Date.now() || this.nonce !== entry.nonce) {
        throw new errors.RenewLockFailed('Failed to renew lock.');
      }

      await runQuery({
        connection,
        query: `UPDATE \`${this.tableNames.locks}\`
           SET expiresAt = ?
         WHERE name = ?;`,
        parameters: [ expiresAt, name ]
      });
    } finally {
      MySqlLockStore.releaseConnection({ connection });
    }
  }

  public async releaseLock ({ name }: {
    name: any;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT expiresAt, nonce
          FROM \`${this.tableNames.locks}\`
         WHERE name = ?;`,
        parameters: [ name ]
      });

      if (rows.length === 0) {
        return;
      }

      const [ entry ] = rows;

      if (Date.now() < entry.expiresAt && this.nonce !== entry.nonce) {
        throw new errors.ReleaseLockFailed('Failed to release lock.');
      }

      await runQuery({
        connection,
        query: `DELETE FROM \`${this.tableNames.locks}\`
         WHERE name = ?;`,
        parameters: [ name ]
      });
    } finally {
      MySqlLockStore.releaseConnection({ connection });
    }
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
  }
}

export { MySqlLockStore };
