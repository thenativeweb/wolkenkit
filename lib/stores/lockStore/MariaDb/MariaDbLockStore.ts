import { LockStore } from '../LockStore';
import { mariaDb as maxDate } from '../../../common/utils/maxDate';
import { noop } from 'lodash';
import retry from 'async-retry';
import { runQuery } from '../../utils/mySql/runQuery';
import { sortKeys } from '../../../common/utils/sortKeys';
import { TableNames } from './TableNames';
import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';

class MariaDbLockStore implements LockStore {
  protected tableNames: TableNames;

  protected pool: Pool;

  protected nonce: null | string;

  protected maxLockSize: number;

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
    (connection as any).removeListener('end', MariaDbLockStore.onUnexpectedClose);
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
    hostname,
    port,
    username,
    password,
    database,
    tableNames,
    nonce = null,
    maxLockSize = 968
  }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    tableNames: TableNames;
    nonce?: null | string;
    maxLockSize?: number;
  }): Promise<MariaDbLockStore> {
    const pool = createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });

    pool.on('connection', (connection: PoolConnection): void => {
      connection.on('error', (err): never => {
        throw err;
      });
      connection.on('end', MariaDbLockStore.onUnexpectedClose);
    });

    const lockStore = new MariaDbLockStore({
      tableNames,
      pool,
      nonce,
      maxLockSize
    });

    const connection = await lockStore.getDatabase();

    await runQuery({
      connection,
      query: `CREATE TABLE IF NOT EXISTS ${tableNames.locks} (
        namespace VARCHAR(64) NOT NULL,
        value VARCHAR(${maxLockSize}) NOT NULL,
        expiresAt DATETIME(3) NOT NULL,
        nonce VARCHAR(64),

        PRIMARY KEY(namespace, value)
      );`
    });

    MariaDbLockStore.releaseConnection({ connection });

    return lockStore;
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
    const sortedSerializedValue = JSON.stringify(sortKeys({
      object: value,
      recursive: true
    }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT expiresAt
          FROM ${this.tableNames.locks}
         WHERE namespace = ?
           AND value = ?;`,
        parameters: [ namespace, sortedSerializedValue ]
      });

      let newEntry = true;

      if (rows.length > 0) {
        const [ entry ] = rows;
        const isLocked = Date.now() < entry.expiresAt.getTime();

        if (isLocked) {
          throw new Error('Failed to acquire lock.');
        }

        newEntry = false;
      }

      let query;

      if (newEntry) {
        query = `
        INSERT INTO ${this.tableNames.locks} (expiresAt, nonce, namespace, value)
        VALUES (?, ?, ?, ?);`;
      } else {
        query = `
        UPDATE ${this.tableNames.locks}
           SET expiresAt = ?,
               nonce = ?
         WHERE namespace = ?
           AND value = ?;`;
      }

      await runQuery({
        connection,
        query,
        parameters: [ new Date(expiresAt), this.nonce, namespace, sortedSerializedValue ]
      });

      try {
        await onAcquired();
      } catch (ex) {
        await this.releaseLock({ namespace, value });

        throw ex;
      }
    } finally {
      MariaDbLockStore.releaseConnection({ connection });
    }
  }

  public async isLocked ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<boolean> {
    const sortedSerializedValue = JSON.stringify(sortKeys({
      object: value,
      recursive: true
    }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

    let isLocked = false;

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT expiresAt
          FROM ${this.tableNames.locks}
         WHERE namespace = ?
           AND value = ?;`,
        parameters: [ namespace, sortedSerializedValue ]
      });

      if (rows.length > 0) {
        const [ entry ] = rows;

        isLocked = Date.now() < entry.expiresAt.getTime();
      }
    } finally {
      MariaDbLockStore.releaseConnection({ connection });
    }

    return isLocked;
  }

  public async renewLock ({ namespace, value, expiresAt }: {
    namespace: string;
    value: any;
    expiresAt: number;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys({
      object: value,
      recursive: true
    }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT expiresAt, nonce
          FROM ${this.tableNames.locks}
         WHERE namespace = ?
           AND value = ?;`,
        parameters: [ namespace, sortedSerializedValue ]
      });

      if (rows.length === 0) {
        throw new Error('Failed to renew lock.');
      }

      const [ entry ] = rows;

      if (entry.expiresAt.getTime() < Date.now() || this.nonce !== entry.nonce) {
        throw new Error('Failed to renew lock.');
      }

      await runQuery({
        connection,
        query: `UPDATE ${this.tableNames.locks}
           SET expiresAt = ?
         WHERE namespace = ?
           AND value = ?;`,
        parameters: [ new Date(expiresAt), namespace, sortedSerializedValue ]
      });
    } finally {
      MariaDbLockStore.releaseConnection({ connection });
    }
  }

  public async releaseLock ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys({
      object: value,
      recursive: true
    }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

    try {
      const [ rows ] = await runQuery({
        connection,
        query: `SELECT expiresAt, nonce
          FROM ${this.tableNames.locks}
         WHERE namespace = ?
           AND value = ?;`,
        parameters: [ namespace, sortedSerializedValue ]
      });

      if (rows.length === 0) {
        return;
      }

      const [ entry ] = rows;

      if (Date.now() < entry.expiresAt.getTime() && this.nonce !== entry.nonce) {
        throw new Error('Failed to release lock.');
      }

      await runQuery({
        connection,
        query: `DELETE FROM ${this.tableNames.locks}
         WHERE namespace = ?
           AND value = ?;`,
        parameters: [ namespace, sortedSerializedValue ]
      });
    } finally {
      MariaDbLockStore.releaseConnection({ connection });
    }
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
  }
}

export { MariaDbLockStore };
