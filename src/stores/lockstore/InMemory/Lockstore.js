'use strict';

const noop = require('lodash/noop');

const sortObjectKeys = require('../sortObjectKeys');

// This value represents the maximum possible date in JavaScript. For details
// see: http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
const maxDate = 8640000000000000;

class Lockstore {
  async initialize ({ maxLockSize = 2048 } = {}) {
    this.maxLockSize = maxLockSize;
    this.database = {
      locks: []
    };
  }

  getLockName ({ namespace, value }) {
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

    const name = `${namespace}#${sortedSerializedValue}`;

    return name;
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

    const name = this.getLockName({ namespace, value });

    const isLocked = this.database.locks.some(
      lock => lock.name === name && Date.now() < lock.expiresAt
    );

    if (isLocked) {
      throw new Error('Failed to acquire lock.');
    }

    const lock = { name, expiresAt };

    this.database.locks.push(lock);

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

    const name = this.getLockName({ namespace, value });

    const isLocked = this.database.locks.some(
      lock => lock.name === name && Date.now() < lock.expiresAt
    );

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

    const name = this.getLockName({ namespace, value });
    const existingLock = this.database.locks.find(
      lock => lock.name === name && Date.now() < lock.expiresAt
    );

    if (!existingLock) {
      throw new Error('Failed to renew lock.');
    }

    existingLock.expiresAt = expiresAt;
  }

  async releaseLock ({ namespace, value }) {
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }
    if (!value) {
      throw new Error('Value is missing.');
    }

    const name = this.getLockName({ namespace, value });
    const index = this.database.locks.findIndex(
      lock => lock.name === name
    );

    if (index === -1) {
      return;
    }

    this.database.locks.splice(index, 1);
  }

  async destroy () {
    this.database = {
      locks: []
    };
  }
}

module.exports = Lockstore;
