'use strict';

const noop = require('lodash/noop');

const limitAlphanumeric = require('limit-alphanumeric'),
      pg = require('pg'),
      retry = require('async-retry');

// This value represents the maximum possible date in JavaScript. For details
// see: http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
const maxDate = 8640000000000000;

class Lockstore {
  static onUnexpectedClose () {
    throw new Error('Connection closed unexpectedly.');
  }

  async getDatabase () {
    const database = await retry(async () => {
      const connection = await this.pool.connect();

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
    maxLockSize = 2048
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

    this.pool = new pg.Pool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    this.pool.on('error', err => {
      throw err;
    });

    const connection = await this.getDatabase();

    this.disconnectWatcher = new pg.Client({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    this.disconnectWatcher.on('end', Lockstore.onUnexpectedClose);
    this.disconnectWatcher.on('error', err => {
      throw err;
    });

    await new Promise(resolve => {
      this.disconnectWatcher.connect(resolve);
    });

    try {
      await retry(async () => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${this.namespace}_locks" (
            "namespace" VARCHAR(64) NOT NULL,
            "value" jsonb NOT NULL,
            "expiresAt" timestamp NOT NULL,
            "nonce" VARCHAR(64),

            CONSTRAINT "${this.namespace}_locks_pk" PRIMARY KEY("namespace", "value")
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

    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

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

  async isLocked ({ namespace, value }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }

    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

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

    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

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

  async releaseLock ({ namespace, value }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }

    const serializedValue = JSON.stringify(value);

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const connection = await this.getDatabase();

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

  async destroy () {
    if (this.disconnectWatcher) {
      this.disconnectWatcher.removeListener('end', Lockstore.onUnexpectedClose);
      await this.disconnectWatcher.end();
    }
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = Lockstore;
