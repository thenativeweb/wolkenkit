import { getTestsFor } from './getTestsFor';
import { InMemoryLockStore } from '../../../../lib/stores/lockStore/InMemory';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';

const maxLockSize = 2048;

suite('InMemory', (): void => {
  getTestsFor({
    async createLockStore (): Promise<LockStore> {
      return await InMemoryLockStore.create({
        maxLockSize
      });
    },
    maxLockSize,
    inMemory: true
  });
});
