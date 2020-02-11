import { LockService } from './LockService';
import { LockStore } from '../../stores/lockStore/LockStore';

const getLockService = function ({ lockStore }: {
  lockStore: LockStore;
}): LockService {
  return {
    acquireLock: lockStore.acquireLock.bind(lockStore),
    isLocked: lockStore.isLocked.bind(lockStore),
    renewLock: lockStore.renewLock.bind(lockStore),
    releaseLock: lockStore.releaseLock.bind(lockStore)
  };
};

export { getLockService };
