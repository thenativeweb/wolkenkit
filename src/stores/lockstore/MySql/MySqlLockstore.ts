import { Lockstore } from '../Lockstore';
import { mySql as maxDate } from '../../../common/utils/maxDate';
import mysql from 'mysql';
import { query as mysqlQuery } from '../../utils/mysql/query';
import noop from 'lodash/noop';
import retry from 'async-retry';
import sortKeys from 'sort-keys';

class MySqlLockstore implements Lockstore {
  protected namespace: string;

  protected pool: mysql.Pool;

  protected nonce: null | number;

  protected maxLockSize: number;

  protected constructor ({ namespace, pool, nonce, maxLockSize }: {
    namespace: string;
    pool: mysql.Pool;
    nonce: null | number;
    maxLockSize: number;
  }) {
    this.namespace = namespace;
    this.pool = pool;
    this.nonce = nonce;
    this.maxLockSize = maxLockSize;
  }

  public static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected async getDatabase (): Promise<mysql.PoolConnection> {
    const database = await retry(async (): Promise<mysql.PoolConnection> => new Promise((resolve, reject): void => {
      this.pool.getConnection((err: null | mysql.MysqlError, poolConnection: mysql.PoolConnection): void => {
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
    hostname,
    port,
    username,
    password,
    database,
    namespace,
    nonce = null,
    maxLockSize = 2048
  }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    namespace: string;
    nonce: null | number;
    maxLockSize: number;
  }): Promise<MySqlLockstore> {
    const prefixedNamespace = `lockstore_${namespace.replace(/[\W_]/ug, '')}`;

    const pool = mysql.createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });

    pool.on('connection', (connection: mysql.PoolConnection): void => {
      connection.on('error', (err: Error): never => {
        throw err;
      });
      connection.on('end', MySqlLockstore.onUnexpectedClose);
    });

    const eventstore = new MySqlLockstore({
      namespace: prefixedNamespace,
      pool,
      nonce,
      maxLockSize
    });

    const connection = await eventstore.getDatabase();

    await mysqlQuery(
      connection,
      `CREATE TABLE IF NOT EXISTS ${prefixedNamespace}_locks (
        namespace VARCHAR(64) NOT NULL,
        value VARCHAR(${maxLockSize}) NOT NULL,
        expiresAt DATETIME(3) NOT NULL,
        nonce VARCHAR(64),

        PRIMARY KEY(namespace, value)
      );`
    );

    connection.release();

    return eventstore;
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
    const sortedSerializedValue = JSON.stringify(sortKeys(value, { deep: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

    try {
      const rows = await mysqlQuery(
        connection,
        `SELECT expiresAt
          FROM ${this.namespace}_locks
         WHERE namespace = ?
           AND value = ?;`,
        [ namespace, sortedSerializedValue ]
      );

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
        INSERT INTO ${this.namespace}_locks (expiresAt, nonce, namespace, value)
        VALUES (?, ?, ?, ?);`;
      } else {
        query = `
        UPDATE ${this.namespace}_locks
           SET expiresAt = ?,
               nonce = ?
         WHERE namespace = ?
           AND value = ?;`;
      }

      await mysqlQuery(
        connection,
        query,
        [ new Date(expiresAt), this.nonce, namespace, sortedSerializedValue ]
      );

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
    const sortedSerializedValue = JSON.stringify(sortKeys(value, { deep: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

    let isLocked = false;

    try {
      const rows = await mysqlQuery(
        connection,
        `SELECT expiresAt
          FROM ${this.namespace}_locks
         WHERE namespace = ?
           AND value = ?;`,
        [ namespace, sortedSerializedValue ]
      );

      if (rows.length > 0) {
        const [ entry ] = rows;

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
    const sortedSerializedValue = JSON.stringify(sortKeys(value, { deep: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

    try {
      const rows = await mysqlQuery(
        connection,
        `SELECT expiresAt, nonce
          FROM ${this.namespace}_locks
         WHERE namespace = ?
           AND value = ?;`,
        [ namespace, sortedSerializedValue ]
      );

      if (rows.length === 0) {
        throw new Error('Failed to renew lock.');
      }

      const [ entry ] = rows;

      if (entry.expiresAt.getTime() < Date.now() || this.nonce !== entry.nonce) {
        throw new Error('Failed to renew lock.');
      }

      await mysqlQuery(
        connection,
        `UPDATE ${this.namespace}_locks
           SET expiresAt = ?
         WHERE namespace = ?
           AND value = ?;`,
        [ new Date(expiresAt), namespace, sortedSerializedValue ]
      );
    } finally {
      connection.release();
    }
  }

  public async releaseLock ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys(value, { deep: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

    try {
      const rows = await mysqlQuery(
        connection,
        `SELECT expiresAt, nonce
          FROM ${this.namespace}_locks
         WHERE namespace = ?
           AND value = ?;`,
        [ namespace, sortedSerializedValue ]
      );

      if (rows.length === 0) {
        return;
      }

      const [ entry ] = rows;

      if (Date.now() < entry.expiresAt.getTime() && this.nonce !== entry.nonce) {
        throw new Error('Failed to release lock.');
      }

      await mysqlQuery(
        connection,
        `DELETE FROM ${this.namespace}_locks
         WHERE namespace = ?
           AND value = ?;`,
        [ namespace, sortedSerializedValue ]
      );
    } finally {
      connection.release();
    }
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
  }
}

export default MySqlLockstore;
