import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createPriorityQueueStore } from '../../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { PriorityQueueSqlServerOptions } from './PriorityQueueSqlServerOptions';
import { PriorityQueueStoreOptions } from '../../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';

const priorityQueueSqlServerCommand = function (): Command<PriorityQueueSqlServerOptions> {
  return {
    name: 'sqlserver',
    description: 'Set up a SQL Server priority queue store.',

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
        type: 'SqlServer',
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
        buntstift.info('Setting up the SQL Server priority queue store...');

        const store = await createPriorityQueueStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the SQL Server priority queue store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the SQL Server priority queue store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { priorityQueueSqlServerCommand };
