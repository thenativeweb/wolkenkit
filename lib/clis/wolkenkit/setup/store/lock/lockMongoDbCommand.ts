import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createLockStore } from '../../../../../stores/lockStore/createLockStore';
import { LockMongoDbOptions } from './LockMongoDbOptions';
import { LockStoreOptions } from '../../../../../stores/lockStore/LockStoreOptions';

const lockMongoDbCommand = function (): Command<LockMongoDbOptions> {
  return {
    name: 'mongodb',
    description: 'Set up a MongoDB lock store.',

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
        buntstift.info('Setting up the MongoDB lock store...');

        const store = await createLockStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the MongoDB lock store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the MongoDB lock store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { lockMongoDbCommand };
