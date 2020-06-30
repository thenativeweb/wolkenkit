import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { getShortId } from '../../../shared/getShortId';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { sleep } from '../../../../lib/common/utils/sleep';

/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createLockStore }: {
  createLockStore ({ suffix }: { suffix: string }): Promise<LockStore>;
}): void {
  let lockStore: LockStore,
      suffix: string,
      value: string;

  setup(async (): Promise<void> => {
    suffix = getShortId();
    lockStore = await createLockStore({ suffix });
    value = JSON.stringify({ foo: 'bar' });
  });

  teardown(async function (): Promise<void> {
    this.timeout(20_000);

    await lockStore.destroy();
  });

  suite('acquireLock', (): void => {
    test('acquires a lock.', async (): Promise<void> => {
      await lockStore.acquireLock({ value });
    });

    test('throws an error if the lock is already in place.', async (): Promise<void> => {
      await lockStore.acquireLock({ value });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ value });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'ELOCKACQUIREFAILED' && ex.message === 'Failed to acquire lock.');
    });

    test('supports locks with different values.', async (): Promise<void> => {
      const otherValue = JSON.stringify({ foo: 'baz' });

      await lockStore.acquireLock({ value });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ value: otherValue });
      }).is.not.throwingAsync();
    });

    test('acquires a lock if the lock is already in place, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });

      await sleep({ ms: 150 });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ value });
      }).is.not.throwingAsync();
    });

    test('throws an error if the expiration date is in the past.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ value, expiresAt: Date.now() - 100 });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EEXPIRATIONINPAST' && ex.message === 'A lock must not expire in the past.');
    });
  });

  suite('isLocked', (): void => {
    test('returns false if the given lock does not exist.', async (): Promise<void> => {
      const isLocked = await lockStore.isLocked({ value });

      assert.that(isLocked).is.false();
    });

    test('returns true if the given lock exists.', async (): Promise<void> => {
      await lockStore.acquireLock({ value });
      const isLocked = await lockStore.isLocked({ value });

      assert.that(isLocked).is.true();
    });

    test('returns false if the given lock exists, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });

      await sleep({ ms: 150 });

      const isLocked = await lockStore.isLocked({ value });

      assert.that(isLocked).is.false();
    });
  });

  suite('renewLock', (): void => {
    test('throws an error if the given lock does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.renewLock({ value, expiresAt: Date.now() + 100 });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'ELOCKRENEWALFAILED' && ex.message === 'Failed to renew lock.');
    });

    test('throws an error if the given lock exists, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });
      await sleep({ ms: 150 });

      await assert.that(async (): Promise<void> => {
        await lockStore.renewLock({ value, expiresAt: Date.now() + 100 });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'ELOCKRENEWALFAILED' && ex.message === 'Failed to renew lock.');
    });

    test('throws an error if the expiration date is in the past.', async (): Promise<void> => {
      await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });
      await sleep({ ms: 50 });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ value, expiresAt: Date.now() - 100 });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EEXPIRATIONINPAST' && ex.message === 'A lock must not expire in the past.');
    });

    test('renews the lock.', async (): Promise<void> => {
      // Please note that this test highly depends on the times used. If you
      // change the times, make sure to keep the logic.
      await lockStore.acquireLock({ value, expiresAt: Date.now() + 500 });
      await sleep({ ms: 450 });

      await lockStore.renewLock({ value, expiresAt: Date.now() + 500 });
      await sleep({ ms: 450 });

      // If renewing didn't work, now more time has passed than the original
      // expiration time, so the lock has expired. We can verify this by trying
      // to acquire the lock: If we can not acquire the lock, it is still active
      // and renewing did work.
      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ value });
      }).is.throwingAsync();
    });
  });

  suite('releaseLock', (): void => {
    test('releases the lock.', async (): Promise<void> => {
      await lockStore.acquireLock({ value });
      await lockStore.releaseLock({ value });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ value });
      }).is.not.throwingAsync();
    });

    test('does not throw an error if the lock does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.releaseLock({ value });
      }).is.not.throwingAsync();
    });

    test('does not throw an error if the lock has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });
      await sleep({ ms: 150 });

      await assert.that(async (): Promise<void> => {
        await lockStore.releaseLock({ value });
      }).is.not.throwingAsync();
    });
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
