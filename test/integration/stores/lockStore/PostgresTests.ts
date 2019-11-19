import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { PostgresLockStore } from '../../../../lib/stores/lockStore/Postgres';

const maxLockSize = 2048;

suite('Postgres', (): void => {
  getTestsFor({
    async createLockStore ({ suffix, nonce }: {
      suffix: string;
      nonce?: string;
    }): Promise<LockStore> {
      return await PostgresLockStore.create({
        ...connectionOptions.postgres,
        maxLockSize,
        tableNames: {
          locks: `locks_${suffix}`
        },
        encryptConnection: false,
        nonce
      });
    },
    maxLockSize
  });
});
