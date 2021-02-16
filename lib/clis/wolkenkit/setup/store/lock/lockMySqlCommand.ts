import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createLockStore } from '../../../../../stores/lockStore/createLockStore';
import { LockMySqlOptions } from './LockMySqlOptions';
import { LockStoreOptions } from '../../../../../stores/lockStore/LockStoreOptions';

const lockMySqlCommand = function (): Command<LockMySqlOptions> {
  return {
    name: 'mysql',
    description: 'Set up a MySQL lock store.',

    optionDefinitions: [
      {
        name: 'host-name',
        type: 'string',
        isRequired: true
      },
      {
        name: 'port',
        type: 'number',
        defaultValue: 3_363
      },
      {
        name: 'user-name',
        type: 'string',
        isRequired: true
      },
      {
        name: 'password',
        type: 'string',
        isRequired: true
      },
      {
        name: 'database',
        type: 'string',
        isRequired: true
      },
      {
        name: 'table-name-locks',
        type: 'string',
        defaultValue: 'locks'
      }
    ],

    async handle ({ options: {
      'host-name': hostName,
      port,
      'user-name': userName,
      password,
      database,
      'table-name-locks': tableNameLocks,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: LockStoreOptions = {
        type: 'MySql',
        hostName,
        port,
        userName,
        password,
        database,
        tableNames: {
          locks: tableNameLocks
        }
      };

      try {
        buntstift.info('Setting up the MySQL lock store...');

        const store = await createLockStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the MySQL lock store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the MySQL lock store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { lockMySqlCommand };
