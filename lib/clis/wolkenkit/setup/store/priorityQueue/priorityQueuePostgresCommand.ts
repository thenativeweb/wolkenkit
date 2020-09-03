import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createPriorityQueueStore } from '../../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { PriorityQueuePostgresOptions } from './PriorityQueuePostgresOptions';
import { PriorityQueueStoreOptions } from '../../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';

const priorityQueuePostgresCommand = function (): Command<PriorityQueuePostgresOptions> {
  return {
    name: 'postgres',
    description: 'Set up a PostgreSQL priority queue store.',

    optionDefinitions: [
      {
        name: 'host-name',
        type: 'string',
        isRequired: true
      },
      {
        name: 'port',
        type: 'number',
        defaultValue: 3363
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
        name: 'table-name-items',
        type: 'string',
        defaultValue: 'items'
      },
      {
        name: 'table-name-priority-queue',
        type: 'string',
        defaultValue: 'priorityQueue'
      }
    ],

    async handle ({ options: {
      'host-name': hostName,
      port,
      'user-name': userName,
      password,
      database,
      'encrypt-connection': encryptConnection,
      'table-name-items': tableNameItems,
      'table-name-priority-queue': tableNamePriorityQueue,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: PriorityQueueStoreOptions<any, any> = {
        type: 'Postgres',
        doesIdentifierMatchItem (): boolean {
          return false;
        },
        hostName,
        port,
        userName,
        password,
        database,
        encryptConnection,
        tableNames: {
          items: tableNameItems,
          priorityQueue: tableNamePriorityQueue
        }
      };

      try {
        buntstift.info('Setting up the PostgreSQL priority queue store...');

        const store = await createPriorityQueueStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the PostgreSQL priority queue store.');
      } catch (ex) {
        buntstift.error('Failed to set up the PostgreSQL priority queue store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { priorityQueuePostgresCommand };
