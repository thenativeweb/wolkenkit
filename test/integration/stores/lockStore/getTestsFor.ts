import { assert } from 'assertthat';
import { getShortId } from '../../../shared/getShortId';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { sleep } from '../../../../lib/common/utils/sleep';
import { uuid } from 'uuidv4';

const inMilliseconds = function ({ ms }: {
  ms: number;
}): number {
  return Date.now() + ms;
};

const inFiftyMilliseconds = function (): number {
  return inMilliseconds({ ms: 50 });
};

const oneSecondAgo = function (): number {
  return inMilliseconds({ ms: -1000 });
};

/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createLockStore, inMemory = false, maxLockSize }: {
  createLockStore ({ suffix, nonce }: {
    suffix: string;
    nonce?: string;
  }): Promise<LockStore>;
  inMemory?: boolean;
  maxLockSize: number;
}): void {
  let lockStore: LockStore,
      namespace: string,
      suffix: string,
      value: any;

  setup(async (): Promise<void> => {
    suffix = getShortId();
    namespace = uuid();
    lockStore = await createLockStore({ suffix });
    value = { foo: 'bar', baz: 'bam' };
  });

  teardown(async function (): Promise<void> {
    this.timeout(20 * 1000);

    await lockStore.destroy();
  });

  suite('acquireLock', (): void => {
    test('throws an error if the value is too large.', async (): Promise<void> => {
      const exceededValue = 'a'.repeat(maxLockSize);

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ namespace, value: exceededValue, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync('Lock value is too large.');
    });

    test('acquires a lock.', async (): Promise<void> => {
      await lockStore.acquireLock({ namespace, value });
    });

    test('acquires a lock with the maximum accepted size.', async (): Promise<void> => {
      // A JSON serialized string will embed opening and closing quotes
      // Those two characters are part of the lock name.
      const maxValue = 'a'.repeat(maxLockSize - 2);

      await lockStore.acquireLock({ namespace, value: maxValue, expiresAt: inFiftyMilliseconds() });
    });

    test('supports locks with different values.', async (): Promise<void> => {
      const otherValue = { foo: 'baz' };

      await lockStore.acquireLock({ namespace, value });
      await lockStore.acquireLock({ namespace, value: otherValue });
    });

    test('supports locks with different namespaces.', async (): Promise<void> => {
      const otherNamespace = uuid();

      await lockStore.acquireLock({ namespace, value });
      await lockStore.acquireLock({ namespace: otherNamespace, value });
    });

    test('throws an error if the lock is already in place.', async (): Promise<void> => {
      await lockStore.acquireLock({ namespace, value });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ namespace, value });
      }).is.throwingAsync('Failed to acquire lock.');
    });

    test('throws an error also if object keys have different order.', async (): Promise<void> => {
      const nestedValue = { ...value, nested: { ...value }};
      const sortedValue = { baz: 'bam', foo: 'bar' };
      const nestedSortedValue = { ...sortedValue, nested: { ...sortedValue }};

      await lockStore.acquireLock({ namespace, value: nestedValue });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ namespace, value: nestedSortedValue });
      }).is.throwingAsync('Failed to acquire lock.');
    });

    test('acquires a lock if the lock is already in place, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ namespace, value, expiresAt: oneSecondAgo() });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ namespace, value });
      }).is.not.throwingAsync();
    });

    test('releases the lock after the given expiration.', async (): Promise<void> => {
      await lockStore.acquireLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 100 });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ namespace, value });
      }).is.not.throwingAsync();
    });

    test('throws an error if the on acquired handler throws an error.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({
          namespace,
          value,
          async onAcquired (): Promise<void> {
            throw new Error('On acquired failed.');
          }
        });
      }).is.throwingAsync('On acquired failed.');
    });

    test('releases the lock if the on acquired handler throws an error.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({
          namespace,
          value,
          async onAcquired (): Promise<void> {
            throw new Error('On acquired failed.');
          }
        });
      }).is.throwingAsync();

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ namespace, value });
      }).is.not.throwingAsync();
    });
  });

  suite('isLocked', (): void => {
    test('throws an error if the value is too large.', async (): Promise<void> => {
      const exceededValue = 'a'.repeat(maxLockSize);

      await assert.that(async (): Promise<void> => {
        await lockStore.isLocked({ namespace, value: exceededValue });
      }).is.throwingAsync('Lock value is too large.');
    });

    test('returns false if the given lock does not exist.', async (): Promise<void> => {
      const isLocked = await lockStore.isLocked({ namespace, value });

      assert.that(isLocked).is.false();
    });

    test('returns true if the given lock exists.', async (): Promise<void> => {
      await lockStore.acquireLock({ namespace, value });

      const isLocked = await lockStore.isLocked({ namespace, value });

      assert.that(isLocked).is.true();
    });

    test('returns false if the given lock exists, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ namespace, value, expiresAt: inFiftyMilliseconds() });

      await sleep({ ms: 100 });

      const isLocked = await lockStore.isLocked({ namespace, value });

      assert.that(isLocked).is.false();
    });
  });

  suite('renewLock', (): void => {
    test('throws an error if the value is too large.', async (): Promise<void> => {
      const exceededValue = 'a'.repeat(maxLockSize);

      await assert.that(async (): Promise<void> => {
        await lockStore.renewLock({ namespace, value: exceededValue, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync('Lock value is too large.');
    });

    test('throws an error if the given lock does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.renewLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync('Failed to renew lock.');
    });

    test('throws an error if the given lock exists, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 100 });

      await assert.that(async (): Promise<void> => {
        await lockStore.renewLock({ namespace, value, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync('Failed to renew lock.');
    });

    test('renews the lock.', async function (): Promise<void> {
      this.timeout(3 * 1000);

      await lockStore.acquireLock({ namespace, value, expiresAt: inMilliseconds({ ms: 1000 }) });
      await sleep({ ms: 750 });

      await lockStore.renewLock({ namespace, value, expiresAt: inMilliseconds({ ms: 1000 }) });
      await sleep({ ms: 750 });

      // If renewing didn't work, now 1s + waiting have passed, and the original
      // expiration was set to 1s. If we can not acquire the lock, it is still
      // active and renewing did work. In other words: If you change the times
      // above, make sure to keep the logic.
      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ namespace, value });
      }).is.throwingAsync();
    });

    if (!inMemory) {
      test('throws an error if the lock does not belong to the store.', async (): Promise<void> => {
        lockStore = await createLockStore({ suffix, nonce: 'nonce1' });
        const otherLockStore = await createLockStore({ suffix, nonce: 'nonce2' });

        await lockStore.acquireLock({ namespace, value, expiresAt: inMilliseconds({ ms: 100 }) });

        await assert.that(async (): Promise<void> => {
          await otherLockStore.renewLock({ namespace, value, expiresAt: inMilliseconds({ ms: 100 }) });
        }).is.throwingAsync('Failed to renew lock.');
      });
    }
  });

  suite('releaseLock', (): void => {
    test('throws an error if the value is too large.', async (): Promise<void> => {
      const exceededValue = 'a'.repeat(maxLockSize);

      await assert.that(async (): Promise<void> => {
        await lockStore.releaseLock({ namespace, value: exceededValue });
      }).is.throwingAsync('Lock value is too large.');
    });

    test('release the lock.', async (): Promise<void> => {
      await lockStore.acquireLock({ namespace, value });
      await lockStore.releaseLock({ namespace, value });

      await lockStore.acquireLock({ namespace, value });
    });

    test('does not throw an error if the lock does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.releaseLock({ namespace, value });
      }).is.not.throwingAsync();
    });

    if (!inMemory) {
      test('throws an error if the lock does not belong to the store.', async (): Promise<void> => {
        lockStore = await createLockStore({ suffix, nonce: 'nonce1' });
        const otherLockStore = await createLockStore({ suffix, nonce: 'nonce2' });

        await lockStore.acquireLock({ namespace, value });

        await assert.that(async (): Promise<void> => {
          await otherLockStore.releaseLock({ namespace, value });
        }).is.throwingAsync('Failed to release lock.');
      });
    }
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
