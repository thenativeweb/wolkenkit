import getTestsFor from './getTestsFor';
import InMemoryLockstore from '../../../../src/stores/lockstore/InMemory';
import { Lockstore } from '../../../../src/stores/lockstore/Lockstore';

const maxLockSize = 2048;

suite('InMemory', (): void => {
  getTestsFor({
    async lockstoreFactory (): Promise<Lockstore> {
      return await InMemoryLockstore.create({ maxLockSize });
    },
    inMemory: true,
    maxLockSize
  });
});
