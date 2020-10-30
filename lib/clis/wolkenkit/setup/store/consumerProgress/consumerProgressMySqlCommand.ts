import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { ConsumerProgressMySqlOptions } from './ConsumerProgressMySqlOptions';
import { ConsumerProgressStoreOptions } from '../../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { createConsumerProgressStore } from '../../../../../stores/consumerProgressStore/createConsumerProgressStore';

const consumerProgressMySqlCommand = function (): Command<ConsumerProgressMySqlOptions> {
  return {
    name: 'mysql',
    description: 'Set up a MySQL consumer progress store.',

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
        name: 'table-name-progress',
        type: 'string',
        defaultValue: 'progress'
      }
    ],

    async handle ({ options: {
      'host-name': hostName,
      port,
      'user-name': userName,
      password,
      database,
      'table-name-progress': tableNameProgress,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: ConsumerProgressStoreOptions = {
        type: 'MySql',
        hostName,
        port,
        userName,
        password,
        database,
        tableNames: {
          progress: tableNameProgress
        }
      };

      try {
        buntstift.info('Setting up the MySQL consumer progress store...');

        const store = await createConsumerProgressStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the MySQL consumer progress store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the MySQL consumer progress store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { consumerProgressMySqlCommand };
