import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { SqlServerLockStore } from '../../../../lib/stores/lockStore/SqlServer';

suite('SqlServer', (): void => {
  getTestsFor({
    async createLockStore ({ suffix }: {
      suffix: string;
    }): Promise<LockStore> {
      return await SqlServerLockStore.create({
        ...connectionOptions.sqlServer,
        tableNames: {
          locks: `locks_${suffix}`
        }
      });
    }
  });
});
