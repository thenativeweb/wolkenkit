'use strict';

const noop = require('lodash/noop');

const limitAlphanumeric = require('limit-alphanumeric'),
      mysql = require('mysql2/promise'),
      retry = require('async-retry');

const sortObjectKeys = require('../sortObjectKeys');

// Max mysql/mariadb timestamp is 9999-12-31 23:59:59
const maxDate = 253402297199000;

class Lockstore {
  static onUnexpectedClose () {
    throw new Error('Connection closed unexpectedly.');
  }

  async getDatabase () {
    const database = await retry(async () => {
      const connection = await this.pool.getConnection();

      return connection;
    });

    return database;
  }

  async initialize ({ hostname, port, username, password, database, namespace }) {
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

    this.namespace = `store_${limitAlphanumeric(namespace)}`;

    this.pool = mysql.createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });

    this.pool.on('connection', connection => {
      connection.on('error', err => {
        throw err;
      });
      connection.on('end', Lockstore.onUnexpectedClose);
    });

    const connection = await this.getDatabase();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ${this.namespace}_locks (
        namespace VARCHAR(64) NOT NULL,
        -- 2713 is 2712bytes + 1byte for mysql varchar 
        -- to match postgres max index entry size
        value VARCHAR(2713) NOT NULL, 
        -- bigint allows to avoid datetime/timestamp restrictions
        expiresAt DATETIME(3) NOT NULL,

        PRIMARY KEY(namespace, value)
      );
    `);
    connection.release();
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

    const sortedSerializedValue = JSON.stringify(sortObjectKeys(value));
    const connection = await this.getDatabase();

    try {
      const [ rows ] = await connection.query(`
        SELECT expiresAt
          FROM ${this.namespace}_locks
          WHERE namespace = ?
            AND value = ?`,
      [ namespace, sortedSerializedValue ]);

      let newEntry = true;

      if (rows.length > 0) {
        const entry = rows[0];
        const isLocked = entry.expiresAt.getTime() > Date.now();

        if (isLocked) {
          throw new Error('Failed to acquire lock.');
        }

        newEntry = false;
      }

      let query;

      if (newEntry) {
        query = `
        INSERT INTO ${this.namespace}_locks (namespace, value, expiresAt) 
        VALUES (?, ?, ?)
        `;
      } else {
        query = `
        UPDATE ${this.namespace}_locks 
          SET expiresAt = ?
          WHERE namespace = ?
            AND value = ?
        `;
      }

      await connection.query(query, [ namespace, sortedSerializedValue, new Date(expiresAt) ]);

      try {
        await onAcquired();
      } catch (ex) {
        await this.releaseLock({
          namespace,
          value
        });

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
    const sortedSerializedValue = JSON.stringify(sortObjectKeys(value));
    const connection = await this.getDatabase();

    let isLocked = false;

    try {
      const [ rows ] = await connection.query(`
        SELECT expiresAt
          FROM ${this.namespace}_locks
          WHERE namespace = ?
            AND value = ?`,
      [ namespace, sortedSerializedValue ]);

      if (rows.length > 0) {
        const entry = rows[0];

        isLocked = entry.expiresAt.getTime() > Date.now();
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

    const sortedSerializedValue = JSON.stringify(sortObjectKeys(value));
    const connection = await this.getDatabase();

    try {
      const [ rows ] = await connection.query(`
        SELECT expiresAt
          FROM ${this.namespace}_locks
          WHERE namespace = ?
            AND value = ?`,
      [ namespace, sortedSerializedValue ]);

      if (rows.length === 0) {
        throw new Error('Failed to renew lock.');
      } else {
        const entry = rows[0];

        if (entry.expiresAt.getTime() < Date.now()) {
          throw new Error('Failed to renew lock.');
        }
      }

      await connection.query(`
        UPDATE ${this.namespace}_locks 
          SET expiresAt = ?
          WHERE namespace = ?
            AND value = ?`,
      [ new Date(expiresAt), namespace, sortedSerializedValue ]);
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

    const sortedSerializedValue = JSON.stringify(sortObjectKeys(value));
    const connection = await this.getDatabase();

    try {
      await connection.query(`
        DELETE FROM ${this.namespace}_locks
          WHERE namespace = ?
            AND value = ?`,
      [ namespace, sortedSerializedValue ]);
    } finally {
      connection.release();
    }
  }

  async destroy () {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = Lockstore;
