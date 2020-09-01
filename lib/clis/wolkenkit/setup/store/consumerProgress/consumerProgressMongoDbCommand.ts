import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { ConsumerProgressMongoDbOptions } from './ConsumerProgressMongoDbOptions';
import { ConsumerProgressStoreOptions } from '../../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { createConsumerProgressStore } from '../../../../../stores/consumerProgressStore/createConsumerProgressStore';

const consumerProgressMongoDbCommand = function (): Command<ConsumerProgressMongoDbOptions> {
  return {
    name: 'mongodb',
    description: 'Sets up a MongoDB consumer progress store.',

    optionDefinitions: [
      {
        name: 'connection-string',
        type: 'string',
        isRequired: true
      },
      {
        name: 'collection-name-progress',
        type: 'string',
        defaultValue: 'progress'
      }
    ],

    async handle ({ options: {
      'connection-string': connectionString,
      'collection-name-progress': collectionNameProgress,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: ConsumerProgressStoreOptions = {
        type: 'MongoDb',
        connectionString,
        collectionNames: {
          progress: collectionNameProgress
        }
      };

      try {
        const store = await createConsumerProgressStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up MongoDB consumer progress store.');
      } catch (ex) {
        buntstift.error('Failed to set up MongoDB consumer progress store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { consumerProgressMongoDbCommand };
