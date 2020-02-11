import { assert } from 'assertthat';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';

suite('getLockService', (): void => {
  let lockStore: LockStore;

  let acquireLockCalled = false,
      isLockedCalled = false,
      releaseLockCalled = false,
      renewLockCalled = false;

  setup(async (): Promise<void> => {
    acquireLockCalled = false;
    isLockedCalled = false;
    renewLockCalled = false;
    releaseLockCalled = false;

    lockStore = {
      async acquireLock (): Promise<void> {
        acquireLockCalled = true;
      },
      async isLocked (): Promise<boolean> {
        isLockedCalled = true;

        return true;
      },
      async renewLock (): Promise<void> {
        renewLockCalled = true;
      },
      async releaseLock (): Promise<void> {
        releaseLockCalled = true;
      },
      async destroy (): Promise<void> {
        throw new Error('Invalid operation.');
      }
    };
  });

  test('passes calls to acquireLock through to lock store.', async (): Promise<void> => {
    await lockStore.acquireLock({ name: 'foo' });

    assert.that(acquireLockCalled).is.true();
  });

  test('passes calls to isLocked through to lock store.', async (): Promise<void> => {
    await lockStore.isLocked({ name: 'foo' });

    assert.that(isLockedCalled).is.true();
  });

  test('passes calls to renewLock through to lock store.', async (): Promise<void> => {
    await lockStore.renewLock({ name: 'foo', expiresAt: Date.now() + 500 });

    assert.that(renewLockCalled).is.true();
  });

  test('passes calls to releaseLock through to lock store.', async (): Promise<void> => {
    await lockStore.releaseLock({ name: 'foo' });

    assert.that(releaseLockCalled).is.true();
  });
});
