import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { RedisLockStore } from '../../../../lib/stores/lockStore/Redis';

const maxLockSize = 2048;

suite('Redis', (): void => {
  getTestsFor({
    async createLockStore ({ suffix, nonce }: {
      suffix: string;
      nonce?: string;
    }): Promise<LockStore> {
      return await RedisLockStore.create({
        ...connectionOptions.redis,
        maxLockSize,
        listNames: {
          locks: `locks_${suffix}`
        },
        nonce
      });
    },
    maxLockSize
  });
});
