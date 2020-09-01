import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createPriorityQueueStore } from '../../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { PriorityQueueMongoDbOptions } from './PriorityQueueMongoDbOptions';
import { PriorityQueueStoreOptions } from '../../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';

const priorityQueueMongoDbCommand = function (): Command<PriorityQueueMongoDbOptions> {
  return {
    name: 'mongodb',
    description: 'Sets up a mongodb priority queue store.',

    optionDefinitions: [
      {
        name: 'connection-string',
        type: 'string',
        isRequired: true
      },
      {
        name: 'collection-name-queues',
        type: 'string',
        defaultValue: 'queues'
      }
    ],

    async handle ({ options: {
      'connection-string': connectionString,
      'collection-name-queues': collectionNameQueues,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: PriorityQueueStoreOptions<any, any> = {
        type: 'MongoDb',
        doesIdentifierMatchItem (): boolean {
          return false;
        },
        connectionString,
        collectionNames: {
          queues: collectionNameQueues
        }
      };

      try {
        const store = await createPriorityQueueStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up mongodb priority queue store.');
      } catch (ex) {
        buntstift.error('Failed to set up mongodb priority queue store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { priorityQueueMongoDbCommand };
