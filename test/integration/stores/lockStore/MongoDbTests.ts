import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { MongoDbLockStore } from '../../../../lib/stores/lockStore/MongoDb';

suite('MongoDb', (): void => {
  getTestsFor({
    async createLockStore ({ suffix }: {
      suffix: string;
    }): Promise<LockStore> {
      return await MongoDbLockStore.create({
        ...connectionOptions.mongoDb,
        collectionNames: {
          locks: `locks_${suffix}`
        }
      });
    }
  });
});
