import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { PostgresLockStore } from '../../../../lib/stores/lockStore/Postgres';

suite('Postgres', (): void => {
  getTestsFor({
    async createLockStore ({ suffix }: {
      suffix: string;
    }): Promise<LockStore> {
      return await PostgresLockStore.create({
        type: 'Postgres',
        ...connectionOptions.postgres,
        tableNames: {
          locks: `locks_${suffix}`
        },
        encryptConnection: false
      });
    }
  });
});
