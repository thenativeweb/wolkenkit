import connectionOptions from '../../../shared/containers/connectionOptions';
import getTestsFor from './getTestsFor';
import { Lockstore } from '../../../../lib/stores/lockstore/Lockstore';
import MySqlLockstore from '../../../../lib/stores/lockstore/MySql';

const maxLockSize = 2048;

suite('MySql', (): void => {
  getTestsFor({
    async createLockstore ({ databaseNamespace, nonce }: {
      databaseNamespace: string;
      nonce?: string;
    }): Promise<Lockstore> {
      return await MySqlLockstore.create({
        ...connectionOptions.mySql,
        maxLockSize,
        namespace: databaseNamespace,
        nonce
      });
    },
    maxLockSize
  });
});
