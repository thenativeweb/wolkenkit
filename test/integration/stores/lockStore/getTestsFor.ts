import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { getShortId } from '../../../shared/getShortId';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { sleep } from '../../../../lib/common/utils/sleep';

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
      name: string,
      suffix: string;

  setup(async (): Promise<void> => {
    suffix = getShortId();
    lockStore = await createLockStore({ suffix });
    name = JSON.stringify({ foo: 'bar', baz: 'bam' });
  });

  teardown(async function (): Promise<void> {
    this.timeout(20 * 1000);

    await lockStore.destroy();
  });

  suite('acquireLock', (): void => {
    test('throws an error if the name is too long.', async (): Promise<void> => {
      const exceededName = 'a'.repeat(maxLockSize + 1);

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ name: exceededName, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'ELOCKNAMETOOLONG' && ex.message === 'Lock name is too long.'
      );
    });

    test('acquires a lock.', async (): Promise<void> => {
      await lockStore.acquireLock({ name });
    });

    test('acquires a lock with the maximum accepted size.', async (): Promise<void> => {
      const maxName = 'a'.repeat(maxLockSize);

      await lockStore.acquireLock({ name: maxName, expiresAt: inFiftyMilliseconds() });
    });

    test('supports locks with different names.', async (): Promise<void> => {
      const otherName = JSON.stringify({ foo: 'baz' });

      await lockStore.acquireLock({ name });
      await lockStore.acquireLock({ name: otherName });
    });

    test('throws an error if the lock is already in place.', async (): Promise<void> => {
      await lockStore.acquireLock({ name });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ name });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'EACQUIRELOCKFAILED' && ex.message === 'Failed to acquire lock.'
      );
    });

    test('acquires a lock if the lock is already in place, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ name, expiresAt: inMilliseconds({ ms: 1 }) });

      await sleep({ ms: 10 });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ name });
      }).is.not.throwingAsync();
    });

    test('releases the lock after the given expiration.', async (): Promise<void> => {
      await lockStore.acquireLock({ name, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 100 });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ name });
      }).is.not.throwingAsync();
    });

    test('throws an error if the expiration date is in the past.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ name, expiresAt: oneSecondAgo() });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'EEXPIRATIONINPAST' && ex.message === 'Cannot acquire a lock in the past.'
      );
    });
  });

  suite('isLocked', (): void => {
    test('throws an error if the name is too long.', async (): Promise<void> => {
      const exceededName = 'a'.repeat(maxLockSize + 1);

      await assert.that(async (): Promise<void> => {
        await lockStore.isLocked({ name: exceededName });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'ELOCKNAMETOOLONG' && ex.message === 'Lock name is too long.'
      );
    });

    test('returns false if the given lock does not exist.', async (): Promise<void> => {
      const isLocked = await lockStore.isLocked({ name });

      assert.that(isLocked).is.false();
    });

    test('returns true if the given lock exists.', async (): Promise<void> => {
      await lockStore.acquireLock({ name });

      const isLocked = await lockStore.isLocked({ name });

      assert.that(isLocked).is.true();
    });

    test('returns false if the given lock exists, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ name, expiresAt: inFiftyMilliseconds() });

      await sleep({ ms: 100 });

      const isLocked = await lockStore.isLocked({ name });

      assert.that(isLocked).is.false();
    });
  });

  suite('renewLock', (): void => {
    test('throws an error if the name is too long.', async (): Promise<void> => {
      const exceededName = 'a'.repeat(maxLockSize + 1);

      await assert.that(async (): Promise<void> => {
        await lockStore.renewLock({ name: exceededName, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'ELOCKNAMETOOLONG' && ex.message === 'Lock name is too long.'
      );
    });

    test('throws an error if the given lock does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.renewLock({ name, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'ERENEWLOCKFAILED' && ex.message === 'Failed to renew lock.'
      );
    });

    test('throws an error if the given lock exists, but has expired.', async (): Promise<void> => {
      await lockStore.acquireLock({ name, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 100 });

      await assert.that(async (): Promise<void> => {
        await lockStore.renewLock({ name, expiresAt: inFiftyMilliseconds() });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'ERENEWLOCKFAILED' && ex.message === 'Failed to renew lock.'
      );
    });

    test('throws an error if the expiration date is in the past.', async (): Promise<void> => {
      await lockStore.acquireLock({ name, expiresAt: inFiftyMilliseconds() });
      await sleep({ ms: 20 });

      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ name, expiresAt: oneSecondAgo() });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'EEXPIRATIONINPAST' && ex.message === 'Cannot acquire a lock in the past.'
      );
    });

    test('renews the lock.', async function (): Promise<void> {
      this.timeout(3 * 1000);

      await lockStore.acquireLock({ name, expiresAt: inMilliseconds({ ms: 1000 }) });
      await sleep({ ms: 750 });

      await lockStore.renewLock({ name, expiresAt: inMilliseconds({ ms: 1000 }) });
      await sleep({ ms: 750 });

      // If renewing didn't work, now 1s + waiting have passed, and the original
      // expiration was set to 1s. If we can not acquire the lock, it is still
      // active and renewing did work. In other words: If you change the times
      // above, make sure to keep the logic.
      await assert.that(async (): Promise<void> => {
        await lockStore.acquireLock({ name });
      }).is.throwingAsync();
    });

    if (!inMemory) {
      test('throws an error if the lock does not belong to the store.', async (): Promise<void> => {
        lockStore = await createLockStore({ suffix, nonce: 'nonce1' });
        const otherLockStore = await createLockStore({ suffix, nonce: 'nonce2' });

        await lockStore.acquireLock({ name, expiresAt: inMilliseconds({ ms: 100 }) });

        await assert.that(async (): Promise<void> => {
          await otherLockStore.renewLock({ name, expiresAt: inMilliseconds({ ms: 100 }) });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === 'ERENEWLOCKFAILED' && ex.message === 'Failed to renew lock.'
        );
      });
    }
  });

  suite('releaseLock', (): void => {
    test('throws an error if the name is too long.', async (): Promise<void> => {
      const exceededName = 'a'.repeat(maxLockSize + 1);

      await assert.that(async (): Promise<void> => {
        await lockStore.releaseLock({ name: exceededName });
      }).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'ELOCKNAMETOOLONG' && ex.message === 'Lock name is too long.'
      );
    });

    test('release the lock.', async (): Promise<void> => {
      await lockStore.acquireLock({ name });
      await lockStore.releaseLock({ name });

      await lockStore.acquireLock({ name });
    });

    test('does not throw an error if the lock does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await lockStore.releaseLock({ name });
      }).is.not.throwingAsync();
    });

    if (!inMemory) {
      test('throws an error if the lock does not belong to the store.', async (): Promise<void> => {
        lockStore = await createLockStore({ suffix, nonce: 'nonce1' });
        const otherLockStore = await createLockStore({ suffix, nonce: 'nonce2' });

        await lockStore.acquireLock({ name });

        await assert.that(async (): Promise<void> => {
          await otherLockStore.releaseLock({ name });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === 'ERELEASELOCKFAILED' && ex.message === 'Failed to release lock.'
        );
      });
    }
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
