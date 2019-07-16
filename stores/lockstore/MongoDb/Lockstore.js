'use strict';

const { parse } = require('url');

const limitAlphanumeric = require('limit-alphanumeric'),
      { MongoClient } = require('mongodb'),
      noop = require('lodash/noop'),
      retry = require('async-retry');

const sortObjectKeys = require('../sortObjectKeys');

// This value represents the maximum possible date in JavaScript. For details
// see: http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
const maxDate = 8640000000000000;

class Lockstore {
  constructor () {
    this.client = undefined;
    this.db = undefined;
    this.collections = {};
  }

  static onUnexpectedClose () {
    throw new Error('Connection closed unexpectedly.');
  }

  async initialize ({
    hostname,
    port,
    username,
    password,
    database,
    namespace,
    nonce = null,
    maxLockSize = 968
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

    const url = `mongodb://${username}:${password}@${hostname}:${port}/${database}`;

    /* eslint-disable id-length */
    this.client = await retry(async () => {
      const connection = await MongoClient.connect(url, {
        w: 1,
        useNewUrlParser: true
      });

      return connection;
    });
    /* eslint-enable id-length */

    const databaseName = parse(url).
      pathname.
      substring(1);

    this.db = this.client.db(databaseName);
    this.db.on('close', Lockstore.onUnexpectedClose);

    this.collections.locks = this.db.collection(`${namespace}_locks`);

    await this.collections.locks.createIndexes([
      {
        key: {
          namespace: 1,
          value: 1
        },
        name: `${this.namespace}_namespace_value`,
        unique: true
      }
    ]);
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

    const query = {
      namespace,
      value: sortedSerializedValue
    };
    const entry = await this.collections.locks.findOne(query);

    if (entry) {
      const isLocked = Date.now() < entry.expiresAt.getTime();

      if (isLocked) {
        throw new Error('Failed to acquire lock.');
      }
    }

    const $set = {
      ...query,
      nonce: this.nonce,
      expiresAt: new Date(expiresAt)
    };

    await this.collections.locks.updateOne(query, { $set }, { upsert: true });

    try {
      await onAcquired();
    } catch (ex) {
      await this.releaseLock({ namespace, value });

      throw ex;
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

    const query = {
      namespace,
      value: sortedSerializedValue
    };
    const entry = await this.collections.locks.findOne(query);

    const isLocked = Boolean(entry) && Date.now() < entry.expiresAt.getTime();

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

    const query = {
      namespace,
      value: sortedSerializedValue
    };
    const entry = await this.collections.locks.findOne(query, {
      projection: {
        _id: 0,
        expiresAt: 1,
        nonce: 1
      }
    });

    if (!entry) {
      throw new Error('Failed to renew lock.');
    }
    if (entry.expiresAt.getTime() < Date.now() || this.nonce !== entry.nonce) {
      throw new Error('Failed to renew lock.');
    }

    await this.collections.locks.updateOne(query, { $set: { expiresAt: new Date(expiresAt) }});
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

    const queryGet = {
      namespace,
      value: sortedSerializedValue
    };
    const entry = await this.collections.locks.findOne(queryGet, {
      projection: {
        _id: 0,
        expiresAt: 1,
        nonce: 1
      }
    });

    if (!entry) {
      return;
    }
    if (Date.now() < entry.expiresAt.getTime() && this.nonce !== entry.nonce) {
      throw new Error('Failed to release lock.');
    }

    const queryRemove = {
      namespace,
      value: sortedSerializedValue
    };

    await this.collections.locks.deleteOne(queryRemove);
  }

  async destroy () {
    if (this.db) {
      this.db.removeListener('close', Lockstore.onUnexpectedClose);
    }
    if (this.client) {
      await this.client.close(true);
    }
  }
}

module.exports = Lockstore;
