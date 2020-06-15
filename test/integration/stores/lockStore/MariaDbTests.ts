import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { MySqlLockStore } from '../../../../lib/stores/lockStore/MySql';

suite('MariaDb', (): void => {
  getTestsFor({
    async createLockStore ({ suffix }: {
      suffix: string;
    }): Promise<LockStore> {
      return await MySqlLockStore.create({
        ...connectionOptions.mariaDb,
        tableNames: {
          locks: `locks_${suffix}`
        }
      });
    }
  });
});
