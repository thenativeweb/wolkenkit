import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { ConnectionOptions } from 'tls';
import { createLockStore } from '../../../../../stores/lockStore/createLockStore';
import { getConnectionOptionsSchema } from '../../../../../common/schemas/getConnectionOptionsSchema';
import { LockPostgresOptions } from './LockPostgresOptions';
import { LockStoreOptions } from '../../../../../stores/lockStore/LockStoreOptions';
import { parse } from 'validate-value';

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
        type: 'string'
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
      'encrypt-connection': rawEncryptConnection,
      'table-name-locks': tableNameLocks,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      let encryptConnection: ConnectionOptions | undefined;

      if (rawEncryptConnection) {
        encryptConnection = parse<ConnectionOptions>(
          JSON.parse(rawEncryptConnection),
          getConnectionOptionsSchema(),
          { valueName: 'encryptConnection' }
        ).unwrapOrThrow();
      }

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
