import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createLockStore } from '../../../../../stores/lockStore/createLockStore';
import { LockRedisOptions } from './LockRedisOptions';
import { LockStoreOptions } from '../../../../../stores/lockStore/LockStoreOptions';

const lockRedisCommand = function (): Command<LockRedisOptions> {
  return {
    name: 'redis',
    description: 'Sets up a redis lock store.',

    optionDefinitions: [
      {
        name: 'host-name',
        type: 'string',
        isRequired: true
      },
      {
        name: 'port',
        type: 'number',
        defaultValue: 6379
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
        const store = await createLockStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up redis lock store.');
      } catch (ex) {
        buntstift.error('Failed to set up redis lock store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { lockRedisCommand };
