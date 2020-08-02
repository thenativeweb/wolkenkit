import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { RedisLockStore } from '../../../../lib/stores/lockStore/Redis';

suite('Redis', (): void => {
  getTestsFor({
    async createLockStore ({ suffix }: {
      suffix: string;
    }): Promise<LockStore> {
      return await RedisLockStore.create({
        type: 'Redis',
        ...connectionOptions.redis,
        listNames: {
          locks: `locks_${suffix}`
        }
      });
    }
  });
});
