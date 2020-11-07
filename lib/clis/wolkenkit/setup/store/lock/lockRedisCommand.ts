import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createLockStore } from '../../../../../stores/lockStore/createLockStore';
import { LockRedisOptions } from './LockRedisOptions';
import { LockStoreOptions } from '../../../../../stores/lockStore/LockStoreOptions';

const lockRedisCommand = function (): Command<LockRedisOptions> {
  return {
    name: 'redis',
    description: 'Set up a Redis lock store.',

    optionDefinitions: [
      {
        name: 'host-name',
        type: 'string',
        isRequired: true
      },
      {
        name: 'port',
        type: 'number',
        defaultValue: 6_379
      },
      {
        name: 'password',
        type: 'string',
        isRequired: true
      },
      {
        name: 'database',
        type: 'number',
        defaultValue: 0
      },
      {
        name: 'list-name-locks',
        type: 'string',
        isRequired: true
      }
    ],

    async handle ({ options: {
      'host-name': hostName,
      port,
      password,
      database,
      'list-name-locks': listNameLocks,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: LockStoreOptions = {
        type: 'Redis',
        hostName,
        port,
        password,
        database,
        listNames: {
          locks: listNameLocks
        }
      };

      try {
        buntstift.info('Setting up the Redis lock store...');

        const store = await createLockStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the Redis lock store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the Redis lock store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { lockRedisCommand };
