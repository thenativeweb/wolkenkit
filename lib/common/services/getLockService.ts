import { LockService } from './LockService';
import { LockStore } from '../../stores/lockStore/LockStore';

const getLockService = function ({ lockStore }: {
  lockStore: LockStore;
}): LockService {
  return {
    async acquireLock ({ value, expiresAt }: {
      value: string;
      expiresAt?: number;
    }): Promise<void> {
      return await lockStore.acquireLock({ value, expiresAt });
    },

    async isLocked ({ value }: {
      value: string;
    }): Promise<boolean> {
      return await lockStore.isLocked({ value });
    },

    async renewLock ({ value, expiresAt }: {
      value: string;
      expiresAt: number;
    }): Promise<void> {
      return await lockStore.renewLock({ value, expiresAt });
    },

    async releaseLock ({ value }: {
      value: string;
    }): Promise<void> {
      return await lockStore.releaseLock({ value });
    }
  };
};

export { getLockService };
