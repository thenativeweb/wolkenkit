import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { ConsumerProgressSqlServerOptions } from './ConsumerProgressSqlServerOptions';
import { ConsumerProgressStoreOptions } from '../../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { createConsumerProgressStore } from '../../../../../stores/consumerProgressStore/createConsumerProgressStore';

const consumerProgressSqlServerCommand = function (): Command<ConsumerProgressSqlServerOptions> {
  return {
    name: 'sqlserver',
    description: 'Set up a SQL Server consumer progress store.',

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
      'encrypt-connection': encryptConnection,
      'table-name-progress': tableNameProgress,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: ConsumerProgressStoreOptions = {
        type: 'SqlServer',
        hostName,
        port,
        userName,
        password,
        database,
        encryptConnection,
        tableNames: {
          progress: tableNameProgress
        }
      };

      try {
        buntstift.info('Setting up the SQL Server consumer progress store...');

        const store = await createConsumerProgressStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the SQL Server consumer progress store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the SQL Server consumer progress store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { consumerProgressSqlServerCommand };
