import limitAlphanumeric from '../../../common/utils/limitAlphanumeric';
import { Lockstore } from '../Lockstore';
import maxDate from '../../../common/utils/maxDate';
import { noop } from 'lodash';
import pg from 'pg';
import retry from 'async-retry';

class PostgresLockstore implements Lockstore {
  protected namespace: string;

  protected pool: pg.Pool;

  protected nonce: string | null;

  protected maxLockSize: number;

  protected disconnectWatcher: pg.Client;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected static async getDatabase (pool: pg.Pool): Promise<pg.PoolClient> {
    const database = await retry(async (): Promise<pg.PoolClient> => {
      const connection = await pool.connect();

      return connection;
    });

    return database;
  }

  protected constructor ({ namespace, pool, nonce, maxLockSize, disconnectWatcher }: {
    namespace: string;
    pool: pg.Pool;
    nonce: string | null;
    maxLockSize: number;
    disconnectWatcher: pg.Client;
  }) {
    this.namespace = namespace;
    this.pool = pool;
    this.nonce = nonce;
    this.maxLockSize = maxLockSize;
    this.disconnectWatcher = disconnectWatcher;
  }

  public static async create ({
    hostname,
    port,
    username,
    password,
    database,
    encryptConnection = false,
    namespace,
    nonce = null,
    maxLockSize = 2048
  }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    encryptConnection: boolean;
    namespace: string;
    nonce: string | null;
    maxLockSize: number;
  }): Promise<PostgresLockstore> {
    const prefixedNamespace = `lockstore_${limitAlphanumeric(namespace)}`;

    const pool = new pg.Pool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    pool.on('error', (err: Error): never => {
      throw err;
    });

    const disconnectWatcher = new pg.Client({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    disconnectWatcher.on('end', PostgresLockstore.onUnexpectedClose);
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

    const lockstore = new PostgresLockstore({
      namespace: prefixedNamespace,
      pool,
      nonce,
      maxLockSize,
      disconnectWatcher
    });

    const connection = await PostgresLockstore.getDatabase(pool);

    try {
      await retry(async (): Promise<void> => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${prefixedNamespace}_locks" (
            "namespace" VARCHAR(64) NOT NULL,
            "value" jsonb NOT NULL,
            "expiresAt" timestamp NOT NULL,
            "nonce" VARCHAR(64),

            CONSTRAINT "${prefixedNamespace}_locks_pk" PRIMARY KEY("namespace", "value")
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
    expiresAt: number;
    onAcquired (): void | Promise<void>;
  }): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await PostgresLockstore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get entry',
        text: `
        SELECT "expiresAt"
          FROM "${this.namespace}_locks"
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
        INSERT INTO "${this.namespace}_locks" ("namespace", "value", "expiresAt", "nonce")
        VALUES ($1, $2, $3, $4)
        `;
      } else {
        query = `
        UPDATE "${this.namespace}_locks"
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

    const connection = await PostgresLockstore.getDatabase(this.pool);

    let isLocked = false;

    try {
      const result = await connection.query({
        name: 'get lock',
        text: `
        SELECT "expiresAt"
          FROM "${this.namespace}_locks"
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

    const connection = await PostgresLockstore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get lock',
        text: `
        SELECT "expiresAt", "nonce"
          FROM "${this.namespace}_locks"
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
        UPDATE "${this.namespace}_locks"
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

    const connection = await PostgresLockstore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get lock',
        text: `
        SELECT "expiresAt", "nonce"
          FROM "${this.namespace}_locks"
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
        DELETE FROM "${this.namespace}_locks"
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
    this.disconnectWatcher.removeListener('end', PostgresLockstore.onUnexpectedClose);
    await this.disconnectWatcher.end();
    await this.pool.end();
  }
}

export default PostgresLockstore;
