import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createDomainEventStore } from '../../../../../stores/domainEventStore/createDomainEventStore';
import { DomainEventMongoDbOptions } from './DomainEventMongoDbOptions';
import { DomainEventStoreOptions } from '../../../../../stores/domainEventStore/DomainEventStoreOptions';

const domainEventMongoDbCommand = function (): Command<DomainEventMongoDbOptions> {
  return {
    name: 'mongodb',
    description: 'Set up a MongoDB domain event store.',

    optionDefinitions: [
      {
        name: 'connection-string',
        type: 'string',
        isRequired: true
      },
      {
        name: 'collection-name-domain-events',
        type: 'string',
        defaultValue: 'domainevents'
      },
      {
        name: 'collection-name-snapshots',
        type: 'string',
        defaultValue: 'snapshots'
      }
    ],

    async handle ({ options: {
      'connection-string': connectionString,
      'collection-name-domain-events': collectionNameDomainEvents,
      'collection-name-snapshots': collectionNameSnapshots,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: DomainEventStoreOptions = {
        type: 'MongoDb',
        connectionString,
        collectionNames: {
          domainEvents: collectionNameDomainEvents,
          snapshots: collectionNameSnapshots
        }
      };

      try {
        buntstift.info('Setting up the MongoDB domain event store...');

        const store = await createDomainEventStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the MongoDB domain event store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the MongoDB domain event store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { domainEventMongoDbCommand };
