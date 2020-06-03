import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { MySqlLockStore } from '../../../../lib/stores/lockStore/MySql';

const maxLockSize = 2048;

suite('MariaDb', (): void => {
  getTestsFor({
    async createLockStore ({ suffix, nonce }: {
      suffix: string;
      nonce?: string;
    }): Promise<LockStore> {
      return await MySqlLockStore.create({
        ...connectionOptions.mariaDb,
        maxLockSize,
        tableNames: {
          locks: `locks_${suffix}`
        },
        nonce
      });
    },
    maxLockSize
  });
});
