import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createLockStore } from '../../../../../stores/lockStore/createLockStore';
import { LockMongoDbOptions } from './LockMongoDbOptions';
import { LockStoreOptions } from '../../../../../stores/lockStore/LockStoreOptions';

const lockMongoDbCommand = function (): Command<LockMongoDbOptions> {
  return {
    name: 'mongodb',
    description: 'Sets up a mongodb lock store.',

    optionDefinitions: [
      {
        name: 'connection-string',
        type: 'string',
        isRequired: true
      },
      {
        name: 'collection-name-locks',
        type: 'string',
        defaultValue: 'locks'
      }
    ],

    async handle ({ options: {
      'connection-string': connectionString,
      'collection-name-locks': collectionNameLocks,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: LockStoreOptions = {
        type: 'MongoDb',
        connectionString,
        collectionNames: {
          locks: collectionNameLocks
        }
      };

      try {
        const store = await createLockStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up mongodb lock store.');
      } catch (ex) {
        buntstift.error('Failed to set up mongodb lock store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { lockMongoDbCommand };
