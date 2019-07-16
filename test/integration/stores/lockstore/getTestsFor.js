'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const sleep = require('../../../../common/utils/sleep');

const inMilliseconds = function ({ ms }) {
  return Date.now() + ms;
};

const inFiftyMilliseconds = function () {
  return inMilliseconds({ ms: 50 });
};

const oneSecondAgo = function () {
  return inMilliseconds({ ms: -1000 });
};

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Lockstore, getOptions, type }) {
  let databaseNamespace,
      lockstore,
      namespace,
      value;

  setup(() => {
    lockstore = new Lockstore();
    databaseNamespace = uuid();
    namespace = uuid();
    value = { foo: 'bar', baz: 'bam' };
  });

  teardown(async function () {
    this.timeout(20 * 1000);

    await lockstore.destroy();
  });

  suite('initialize', () => {
    test('does not throw an error if the database is reachable.', async () => {
      await assert.that(async () => {
        await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });
      }).is.not.throwingAsync();
    });

    test('does not throw an error if tables, indexes & co. do already exist.', async () => {
      await assert.that(async () => {
        await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });
        await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });
      }).is.not.throwingAsync();
    });
  });

  suite('acquireLock', () => {
    test('throws an error if the value is too large.', async () => {
      const options = { ...getOptions() };
      const exceededValue = 'a'.repeat(options.maxLockSize);

      await lockstore.initialize({ ...options, namespace: databaseNamespace });

      await assert.that(async () => {
        await lockstore.acquireLock({ namespace, value: exceededValue, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync('Lock value is too large.');
    });

    test('acquires a lock.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await lockstore.acquireLock({ namespace, value });
    });

    test('acquires a lock with the maximum accepted size.', async () => {
      const options = { ...getOptions() };

      // A JSON serialized string will embed opening and closing quotes
      // Those two characters are part of the lock name.
      const maxValue = 'a'.repeat(options.maxLockSize - 2);

      await lockstore.initialize({ ...options, namespace: databaseNamespace });

      await lockstore.acquireLock({ namespace, value: maxValue, expiresAt: inFiftyMilliseconds() });
    });

    test('supports locks with different values.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      const otherValue = { foo: 'baz' };

      await lockstore.acquireLock({ namespace, value });
      await lockstore.acquireLock({ namespace, value: otherValue });
    });

    test('supports locks with different namespaces.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      const otherNamespace = uuid();

      await lockstore.acquireLock({ namespace, value });
      await lockstore.acquireLock({ namespace: otherNamespace, value });
    });

    test('throws an error if the lock is already in place.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });
      await lockstore.acquireLock({ namespace, value });

      await assert.that(async () => {
        await lockstore.acquireLock({ namespace, value });
      }).is.throwingAsync('Failed to acquire lock.');
    });

    test('throws an error also if object keys have different order.', async () => {
      const nestedValue = { ...value, nested: { ...value }};
      const sortedValue = { baz: 'bam', foo: 'bar' };
      const nestedSortedValue = { ...sortedValue, nested: { ...sortedValue }};

      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });
      await lockstore.acquireLock({ namespace, value: nestedValue });

      await assert.that(async () => {
        await lockstore.acquireLock({ namespace, value: nestedSortedValue });
      }).is.throwingAsync('Failed to acquire lock.');
    });

    test('acquires a lock if the lock is already in place, but has expired.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await lockstore.acquireLock({ namespace, value, expiresAt: oneSecondAgo() });

      await assert.that(async () => {
        await lockstore.acquireLock({ namespace, value });
      }).is.not.throwingAsync();
    });

    test('releases the lock after the given expiration.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await lockstore.acquireLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 100 });

      await assert.that(async () => {
        await lockstore.acquireLock({ namespace, value });
      }).is.not.throwingAsync();
    });

    test('throws an error if the on acquired handler throws an error.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await assert.that(async () => {
        await lockstore.acquireLock({
          namespace,
          value,
          async onAcquired () {
            throw new Error('On acquired failed.');
          }
        });
      }).is.throwingAsync('On acquired failed.');
    });

    test('releases the lock if the on acquired handler throws an error.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await assert.that(async () => {
        await lockstore.acquireLock({
          namespace,
          value,
          async onAcquired () {
            throw new Error('On acquired failed.');
          }
        });
      }).is.throwingAsync();

      await assert.that(async () => {
        await lockstore.acquireLock({ namespace, value });
      }).is.not.throwingAsync();
    });
  });

  suite('isLocked', () => {
    test('throws an error if the value is too large.', async () => {
      const options = { ...getOptions() };
      const exceededValue = 'a'.repeat(options.maxLockSize);

      await lockstore.initialize({ ...options, namespace: databaseNamespace });

      await assert.that(async () => {
        await lockstore.isLocked({ namespace, value: exceededValue });
      }).is.throwingAsync('Lock value is too large.');
    });

    test('returns false if the given lock does not exist.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      const isLocked = await lockstore.isLocked({ namespace, value });

      assert.that(isLocked).is.false();
    });

    test('returns true if the given lock exists.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });
      await lockstore.acquireLock({ namespace, value });

      const isLocked = await lockstore.isLocked({ namespace, value });

      assert.that(isLocked).is.true();
    });

    test('returns false if the given lock exists, but has expired.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });
      await lockstore.acquireLock({ namespace, value, expiresAt: inFiftyMilliseconds() });

      await sleep({ ms: 100 });

      const isLocked = await lockstore.isLocked({ namespace, value });

      assert.that(isLocked).is.false();
    });
  });

  suite('renewLock', () => {
    test('throws an error if the value is too large.', async () => {
      const options = { ...getOptions() };
      const exceededValue = 'a'.repeat(options.maxLockSize);

      await lockstore.initialize({ ...options, namespace: databaseNamespace });

      await assert.that(async () => {
        await lockstore.renewLock({ namespace, value: exceededValue, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync('Lock value is too large.');
    });

    test('throws an error if the given lock does not exist.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await assert.that(async () => {
        await lockstore.renewLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync('Failed to renew lock.');
    });

    test('throws an error if the given lock exists, but has expired.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await lockstore.acquireLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 100 });

      await assert.that(async () => {
        await lockstore.renewLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync('Failed to renew lock.');
    });

    test('renews the lock.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await lockstore.acquireLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 25 });

      // Tests tend to be flaky on Sql engines. 100ms
      await lockstore.renewLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 25 });

      // If renewing didn't work, now 50ms + exchange have passed, and the original
      // expiration was set to 50ms. If we can not acquire the lock, it is still
      // active and renewing did work. In other words: If you change the times
      // above, make sure to keep the logic.
      await assert.that(async () => {
        await lockstore.acquireLock({ namespace, value });
      }).is.throwingAsync();
    });

    if (type !== 'InMemory') {
      test('throws an error if the lock does not belong to the store.', async () => {
        const otherLockstore = new Lockstore();

        await lockstore.initialize({
          ...getOptions(),
          namespace: databaseNamespace,
          nonce: 'nonce1'
        });
        await otherLockstore.initialize({
          ...getOptions(),
          namespace: databaseNamespace,
          nonce: 'nonce2'
        });

        await lockstore.acquireLock({ namespace, value, expiresAt: inMilliseconds({ ms: 100 }) });

        await assert.that(async () => {
          await otherLockstore.renewLock({ namespace, value, expiresAt: inMilliseconds({ ms: 100 }) });
        }).is.throwingAsync('Failed to renew lock.');
      });
    }
  });

  suite('releaseLock', () => {
    test('throws an error if the value is too large.', async () => {
      const options = { ...getOptions() };
      const exceededValue = 'a'.repeat(options.maxLockSize);

      await lockstore.initialize({ ...options, namespace: databaseNamespace });

      await assert.that(async () => {
        await lockstore.releaseLock({ namespace, value: exceededValue });
      }).is.throwingAsync('Lock value is too large.');
    });

    test('release the lock.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await lockstore.acquireLock({ namespace, value });
      await lockstore.releaseLock({ namespace, value });

      await lockstore.acquireLock({ namespace, value });
    });

    test('does not throw an error if the lock does not exist.', async () => {
      await lockstore.initialize({ ...getOptions(), namespace: databaseNamespace });

      await assert.that(async () => {
        await lockstore.releaseLock({ namespace, value });
      }).is.not.throwingAsync();
    });

    if (type !== 'InMemory') {
      test('throws an error if the lock does not belong to the store.', async () => {
        const otherLockstore = new Lockstore();

        await lockstore.initialize({
          ...getOptions(),
          namespace: databaseNamespace,
          nonce: 'nonce1'
        });
        await otherLockstore.initialize({
          ...getOptions(),
          namespace: databaseNamespace,
          nonce: 'nonce2'
        });

        await lockstore.acquireLock({ namespace, value });

        await assert.that(async () => {
          await otherLockstore.releaseLock({ namespace, value });
        }).is.throwingAsync('Failed to release lock.');
      });
    }
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
