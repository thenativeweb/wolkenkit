import { LockService } from './LockService';
import { LockStore } from '../../stores/lockStore/LockStore';

const getLockService = function ({ lockStore }: {
  lockStore: LockStore;
}): LockService {
  return {
    async acquireLock ({ name, expiresAt }: {
      name: string;
      expiresAt?: number;
    }): Promise<void> {
      return await lockStore.acquireLock({ name, expiresAt });
    },

    async isLocked ({ name }: {
      name: string;
    }): Promise<boolean> {
      return await lockStore.isLocked({ name });
    },

    async renewLock ({ name, expiresAt }: {
      name: string;
      expiresAt: number;
    }): Promise<void> {
      return await lockStore.renewLock({ name, expiresAt });
    },

    async releaseLock ({ name }: {
      name: string;
    }): Promise<void> {
      return await lockStore.releaseLock({ name });
    }
  };
};

export { getLockService };
