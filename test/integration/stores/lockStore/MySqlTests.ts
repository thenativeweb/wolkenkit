import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { MySqlLockStore } from '../../../../lib/stores/lockStore/MySql';

suite('MySql', (): void => {
  getTestsFor({
    async createLockStore ({ suffix }: {
      suffix: string;
    }): Promise<LockStore> {
      return await MySqlLockStore.create({
        type: 'MySql',
        ...connectionOptions.mySql,
        tableNames: {
          locks: `locks_${suffix}`
        }
      });
    }
  });
});
