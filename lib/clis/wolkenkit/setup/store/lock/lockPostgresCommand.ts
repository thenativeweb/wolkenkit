import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createLockStore } from '../../../../../stores/lockStore/createLockStore';
import { LockPostgresOptions } from './LockPostgresOptions';
import { LockStoreOptions } from '../../../../../stores/lockStore/LockStoreOptions';

const lockPostgresCommand = function (): Command<LockPostgresOptions> {
  return {
    name: 'postgres',
    description: 'Set up a PostgreSQL lock store.',

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
        name: 'encrypt-connection',
        type: 'boolean'
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
      'encrypt-connection': encryptConnection,
      'table-name-locks': tableNameLocks,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: LockStoreOptions = {
        type: 'Postgres',
        hostName,
        port,
        userName,
        password,
        database,
        encryptConnection,
        tableNames: {
          locks: tableNameLocks
        }
      };

      try {
        buntstift.info('Setting up the PostgreSQL lock store...');

        const store = await createLockStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the PostgreSQL lock store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the PostgreSQL lock store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { lockPostgresCommand };
