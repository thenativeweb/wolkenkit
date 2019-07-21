'use strict';

const noop = require('lodash/noop');

const limitAlphanumeric = require('limit-alphanumeric'),
      { Request, TYPES } = require('tedious'),
      retry = require('async-retry');

const createPool = require('../../utils/sqlServer/createPool'),
      sortObjectKeys = require('../sortObjectKeys');

// Max SqlServer datetime2 is 9999-12-31 23:59:59.
const maxDate = 253402297199000;

class Lockstore {
  static onUnexpectedClose () {
    throw new Error('Connection closed unexpectedly.');
  }

  async getDatabase () {
    const database = await retry(async () => {
      const connection = await this.pool.acquire().promise;

      return connection;
    });

    return database;
  }

  async initialize ({
    hostname,
    port,
    username,
    password,
    database,
    encryptConnection = false,
    namespace,
    nonce = null,
    maxLockSize = 828
  }) {
    if (!hostname) {
      throw new Error('Hostname is missing.');
    }
    if (!port) {
      throw new Error('Port is missing.');
    }
    if (!username) {
      throw new Error('Username is missing.');
    }
    if (!password) {
      throw new Error('Password is missing.');
    }
    if (!database) {
      throw new Error('Database is missing.');
    }
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }

    this.nonce = nonce;
    this.maxLockSize = maxLockSize;
    this.namespace = `lockstore_${limitAlphanumeric(namespace)}`;

    this.pool = createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      encrypt: encryptConnection,

      onError (err) {
        throw err;
      },

      onDisconnect () {
        Lockstore.onUnexpectedClose();
      }
    });

    const connection = await this.getDatabase();

    const query = `
      BEGIN TRANSACTION setupTable;

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.namespace}_locks')
        BEGIN
          CREATE TABLE [${this.namespace}_locks] (
            [namespace] NVARCHAR(64) NOT NULL,
            [value] VARCHAR(${this.maxLockSize}) NOT NULL,
            [expiresAt] DATETIME2(3) NOT NULL,
            [nonce] NVARCHAR(64),

            CONSTRAINT [${this.namespace}_locks_pk] PRIMARY KEY([namespace], [value])
          );
        END

      COMMIT TRANSACTION setupTable;
    `;

    await new Promise((resolve, reject) => {
      const request = new Request(query, err => {
        if (err) {
          // When multiple clients initialize at the same time, e.g. during
          // integration tests, SQL Server might throw an error. In this case
          // we simply ignore it.
          if (err.message.match(/There is already an object named.*_locks/u)) {
            return resolve();
          }

          return reject(err);
        }

        resolve();
      });

      connection.execSql(request);
    });

    await this.pool.release(connection);
  }

  async acquireLock ({
    namespace,
    value,
    expiresAt = maxDate,
    onAcquired = noop
  }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }

    const sortedSerializedValue = JSON.stringify(sortObjectKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const database = await this.getDatabase();

    try {
      const result = await new Promise((resolve, reject) => {
        let lockResult;

        const request = new Request(`
          SELECT TOP(1) [expiresAt]
            FROM ${this.namespace}_locks
            WHERE [namespace] = @namespace
              AND [value] = @value
          ;
        `, err => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

        request.once('row', columns => {
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

      let query;

      if (newEntry) {
        query = `
          INSERT INTO [${this.namespace}_locks] ([namespace], [value], [expiresAt], [nonce])
          VALUES (@namespace, @value, @expiresAt, @nonce)
          ;`;
      } else {
        query = `
        UPDATE [${this.namespace}_locks]
           SET [expiresAt] = @expiresAt,
               [nonce] = @nonce
         WHERE [namespace] = @namespace
           AND [value] = @value
         ;`;
      }

      await new Promise((resolve, reject) => {
        const request = new Request(query, err => {
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
      await this.pool.release(database);
    }
  }

  async isLocked ({ namespace, value }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }

    const sortedSerializedValue = JSON.stringify(sortObjectKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const database = await this.getDatabase();

    let isLocked = false;

    try {
      const result = await new Promise((resolve, reject) => {
        let lockResult;

        const request = new Request(`
          SELECT TOP(1) [expiresAt]
            FROM ${this.namespace}_locks
            WHERE [namespace] = @namespace
              AND [value] = @value
          ;
        `, err => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

        request.once('row', columns => {
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
      await this.pool.release(database);
    }

    return isLocked;
  }

  async renewLock ({ namespace, value, expiresAt }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }
    if (!expiresAt) {
      throw new Error('Expires at is missing.');
    }

    const sortedSerializedValue = JSON.stringify(sortObjectKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const database = await this.getDatabase();

    try {
      const result = await new Promise((resolve, reject) => {
        let lockResult;

        const request = new Request(`
          SELECT TOP(1) [expiresAt], [nonce]
            FROM ${this.namespace}_locks
            WHERE [namespace] = @namespace
              AND [value] = @value
          ;
        `, err => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

        request.once('row', columns => {
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

      await new Promise((resolve, reject) => {
        const request = new Request(`
        UPDATE [${this.namespace}_locks]
           SET [expiresAt] = @expiresAt
         WHERE [namespace] = @namespace
           AND [value] = @value
         ;`, err => {
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
      await this.pool.release(database);
    }
  }

  async releaseLock ({ namespace, value }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }

    const sortedSerializedValue = JSON.stringify(sortObjectKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const database = await this.getDatabase();

    try {
      const result = await new Promise((resolve, reject) => {
        let lockResult;

        const request = new Request(`
          SELECT TOP(1) [expiresAt], [nonce]
            FROM ${this.namespace}_locks
            WHERE [namespace] = @namespace
              AND [value] = @value
          ;
        `, err => {
          if (err) {
            return reject(err);
          }

          resolve(lockResult);
        });

        request.addParameter('namespace', TYPES.NVarChar, namespace);
        request.addParameter('value', TYPES.NVarChar, sortedSerializedValue);

        request.once('row', columns => {
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

      await new Promise((resolve, reject) => {
        const request = new Request(`
          DELETE FROM [${this.namespace}_locks]
           WHERE [namespace] = @namespace
             AND [value] = @value
        `, err => {
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
      await this.pool.release(database);
    }
  }

  async destroy () {
    if (this.pool) {
      await this.pool.destroy();
    }
  }
}

module.exports = Lockstore;
