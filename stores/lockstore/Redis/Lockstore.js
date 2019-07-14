'use strict';

const noop = require('lodash/noop');

const limitAlphanumeric = require('limit-alphanumeric'),
      redis = require('redis'),
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

  getLockName ({ namespace, value, store }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }
    if (!store) {
      throw new Error('Store is missing.');
    }

    const sortedSerializedValue = JSON.stringify(sortObjectKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const name = `${store}#${namespace}#${sortedSerializedValue}`;

    return name;
  }

  static getExpiration ({ expiresAt }) {
    if (!expiresAt) {
      throw new Error('Expires at is missing.');
    }

    const expiration = expiresAt - Date.now();

    return expiration;
  }

  static onUnexpectedError () {
    throw new Error('Connection closed unexpectedly.');
  }

  async initialize ({
    hostname,
    port,
    password,
    database,
    namespace,
    nonce = 'null',
    requireValidExpiration = true,
    maxLockSize = 2048
  }) {
    if (!hostname) {
      throw new Error('Hostname is missing.');
    }
    if (!port) {
      throw new Error('Port is missing.');
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

    this.maxLockSize = maxLockSize;
    this.nonce = nonce;
    this.namespace = `lockstore_${limitAlphanumeric(namespace)}`;
    this.requireValidExpiration = requireValidExpiration;

    const url = `redis://:${password}@${hostname}:${port}/${database}`;

    this.client = await retry(() => new Promise((resolve, reject) => {
      const client = redis.createClient({ url });

      client.ping(err => {
        if (err) {
          return reject(err);
        }

        resolve(client);
      });
    }));

    this.client.on('error', Lockstore.onUnexpectedError);
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

    const key = this.getLockName({ namespace, value, store: this.namespace });
    const expiration = Lockstore.getExpiration({ expiresAt });

    let result;

    if (expiration < 0) {
      if (this.requireValidExpiration) {
        throw new Error('Redis cannot acquire a lock in the past.');
      }

      result = 'OK';
    } else {
      result = await new Promise((resolve, reject) => {
        this.client.set(key, this.nonce, 'NX', 'PX', expiration, (err, reply) => {
          if (err) {
            return reject(err);
          }

          resolve(reply);
        });
      });
    }

    if (!result) {
      throw new Error('Failed to acquire lock.');
    }

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
    const key = this.getLockName({ namespace, value, store: this.namespace });

    const existingLock = await new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          return reject(err);
        }

        resolve(reply);
      });
    });

    const isLocked = Boolean(existingLock);

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

    const key = this.getLockName({ namespace, value, store: this.namespace });
    const expiration = Lockstore.getExpiration({ expiresAt });

    let result;

    if (expiration < 0) {
      if (this.requireValidExpiration) {
        throw new Error('Redis cannot renew a lock in the past.');
      }

      result = 'OK';
    } else {
      const existingLock = await new Promise((resolve, reject) => {
        this.client.get(key, (err, reply) => {
          if (err) {
            return reject(err);
          }

          resolve(reply);
        });
      });

      if (existingLock === this.nonce) {
        result = await new Promise((resolve, reject) => {
          this.client.pexpire(key, expiration, (err, reply) => {
            if (err) {
              return reject(err);
            }

            resolve(reply);
          });
        });
      }
    }

    if (!result) {
      throw new Error('Failed to renew lock.');
    }
  }

  async releaseLock ({ namespace, value }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }

    const key = this.getLockName({ namespace, value, store: this.namespace });

    let result;

    const existingLock = await new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          return reject(err);
        }

        resolve(reply);
      });
    });

    if (!existingLock) {
      result = 'OK';
    } else if (existingLock === this.nonce) {
      result = await new Promise((resolve, reject) => {
        this.client.del(key, err => {
          if (err) {
            return reject(err);
          }

          // At some point the entry may already have been removed by Redis
          resolve('OK');
        });
      });
    }

    if (!result) {
      throw new Error('Failed to release lock.');
    }
  }

  async destroy () {
    if (this.client) {
      this.client.removeListener('error', Lockstore.onUnexpectedError);
      this.client.quit();
    }
  }
}

module.exports = Lockstore;
