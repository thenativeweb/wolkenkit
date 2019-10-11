import connectionOptions from '../../../shared/containers/connectionOptions';
import getTestsFor from './getTestsFor';
import { Lockstore } from '../../../../src/stores/lockstore/Lockstore';
import MariaDbLockstore from '../../../../src/stores/lockstore/MariaDb';

const maxLockSize = 2048;

suite('MariaDb', (): void => {
  getTestsFor({
    async createLockstore ({ databaseNamespace, nonce }: {
      databaseNamespace: string;
      nonce?: string;
    }): Promise<Lockstore> {
      return await MariaDbLockstore.create({
        ...connectionOptions.mariaDb,
        maxLockSize,
        namespace: databaseNamespace,
        nonce
      });
    },
    maxLockSize
  });
});
