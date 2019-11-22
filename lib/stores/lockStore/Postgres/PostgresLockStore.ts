import { LockStore } from '../LockStore';
import { javascript as maxDate } from '../../../common/utils/maxDate';
import { noop } from 'lodash';
import retry from 'async-retry';
import { TableNames } from './TableNames';
import { Client, Pool, PoolClient } from 'pg';

class PostgresLockStore implements LockStore {
  protected tableNames: TableNames;

  protected pool: Pool;

  protected nonce: string | null;

  protected maxLockSize: number;

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

  protected constructor ({ tableNames, pool, nonce, maxLockSize, disconnectWatcher }: {
    tableNames: TableNames;
    pool: Pool;
    nonce: string | null;
    maxLockSize: number;
    disconnectWatcher: Client;
  }) {
    this.tableNames = tableNames;
    this.pool = pool;
    this.nonce = nonce;
    this.maxLockSize = maxLockSize;
    this.disconnectWatcher = disconnectWatcher;
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
    maxLockSize = 2048
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection: boolean;
    tableNames: TableNames;
    nonce?: string | null;
    maxLockSize?: number;
  }): Promise<PostgresLockStore> {
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

    await new Promise((resolve, reject): void => {
      try {
        disconnectWatcher.connect(resolve);
      } catch (ex) {
        reject(ex);
      }
    });

    const lockstore = new PostgresLockStore({
      tableNames,
      pool,
      nonce,
      maxLockSize,
      disconnectWatcher
    });

    const connection = await PostgresLockStore.getDatabase(pool);

    try {
      await retry(async (): Promise<void> => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${tableNames.locks}" (
            "namespace" VARCHAR(64) NOT NULL,
            "value" jsonb NOT NULL,
            "expiresAt" timestamp NOT NULL,
            "nonce" VARCHAR(64),

            CONSTRAINT "${tableNames.locks}_pk" PRIMARY KEY("namespace", "value")
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
    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await PostgresLockStore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get entry',
        text: `
        SELECT "expiresAt"
          FROM "${this.tableNames.locks}"
         WHERE "namespace" = $1
           AND "value" = $2
      `,
        values: [ namespace, serializedValue ]
      });

      let newEntry = true;

      if (result.rows.length > 0) {
        const [ entry ] = result.rows;

        const isLocked = Date.now() < entry.expiresAt.getTime();

        if (isLocked) {
          throw new Error('Failed to acquire lock.');
        }

        newEntry = false;
      }

      let query;

      if (newEntry) {
        query = `
        INSERT INTO "${this.tableNames.locks}" ("namespace", "value", "expiresAt", "nonce")
        VALUES ($1, $2, $3, $4)
        `;
      } else {
        query = `
        UPDATE "${this.tableNames.locks}"
           SET "expiresAt" = $3,
               "nonce" = $4
         WHERE "namespace" = $1
           AND "value" = $2
        `;
      }

      await connection.query({
        name: `acquire ${newEntry ? 'new' : 'existing'} lock`,
        text: query,
        values: [ namespace, serializedValue, new Date(expiresAt), this.nonce ]
      });

      try {
        await onAcquired();
      } catch (ex) {
        await this.releaseLock({ namespace, value });

        throw ex;
      }
    } finally {
      connection.release();
    }
  }

  public async isLocked ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<boolean> {
    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await PostgresLockStore.getDatabase(this.pool);

    let isLocked = false;

    try {
      const result = await connection.query({
        name: 'get lock',
        text: `
        SELECT "expiresAt"
          FROM "${this.tableNames.locks}"
         WHERE "namespace" = $1
           AND "value" = $2
      `,
        values: [ namespace, serializedValue ]
      });

      if (result.rows.length > 0) {
        const [ entry ] = result.rows;

        isLocked = Date.now() < entry.expiresAt.getTime();
      }
    } finally {
      connection.release();
    }

    return isLocked;
  }

  public async renewLock ({ namespace, value, expiresAt }: {
    namespace: string;
    value: any;
    expiresAt: number;
  }): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await PostgresLockStore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get lock',
        text: `
        SELECT "expiresAt", "nonce"
          FROM "${this.tableNames.locks}"
         WHERE "namespace" = $1
           AND "value" = $2
      `,
        values: [ namespace, serializedValue ]
      });

      if (result.rows.length === 0) {
        throw new Error('Failed to renew lock.');
      }

      const [ entry ] = result.rows;

      if (entry.expiresAt.getTime() < Date.now() || this.nonce !== entry.nonce) {
        throw new Error('Failed to renew lock.');
      }

      await connection.query({
        name: 'renew lock',
        text: `
        UPDATE "${this.tableNames.locks}"
           SET "expiresAt" = $3
         WHERE "namespace" = $1
           AND "value" = $2
        `,
        values: [ namespace, serializedValue, new Date(expiresAt) ]
      });
    } finally {
      connection.release();
    }
  }

  public async releaseLock ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await PostgresLockStore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get lock',
        text: `
        SELECT "expiresAt", "nonce"
          FROM "${this.tableNames.locks}"
         WHERE "namespace" = $1
           AND "value" = $2
      `,
        values: [ namespace, serializedValue ]
      });

      if (result.rows.length === 0) {
        return;
      }

      const [ entry ] = result.rows;

      if (Date.now() < entry.expiresAt.getTime() && this.nonce !== entry.nonce) {
        throw new Error('Failed to release lock.');
      }

      await connection.query({
        name: 'remove lock',
        text: `
        DELETE FROM "${this.tableNames.locks}"
         WHERE "namespace" = $1
           AND "value" = $2
      `,
        values: [ namespace, serializedValue ]
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
