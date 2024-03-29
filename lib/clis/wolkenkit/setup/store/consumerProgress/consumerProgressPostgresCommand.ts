import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { ConsumerProgressPostgresOptions } from './ConsumerProgressPostgresOptions';
import { ConsumerProgressStoreOptions } from '../../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { createConsumerProgressStore } from '../../../../../stores/consumerProgressStore/createConsumerProgressStore';
import { getPostgresConnectionOptionsSchema } from '../../../../../stores/utils/postgres/getPostgresConnectionOptionsSchema';
import { parse } from 'validate-value';
import { PostgresConnectionOptions } from '../../../../../stores/utils/postgres/PostgresConnectionOptions';

const consumerProgressPostgresCommand = function (): Command<ConsumerProgressPostgresOptions> {
  return {
    name: 'postgres',
    description: 'Set up a PostgreSQL consumer progress store.',

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
        type: 'string'
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
      'encrypt-connection': rawEncryptConnection,
      'table-name-progress': tableNameProgress,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      let encryptConnection: PostgresConnectionOptions | undefined;

      if (rawEncryptConnection) {
        encryptConnection = parse<PostgresConnectionOptions>(
          JSON.parse(rawEncryptConnection),
          getPostgresConnectionOptionsSchema(),
          { valueName: 'encryptConnection' }
        ).unwrapOrThrow();
      }

      const storeOptions: ConsumerProgressStoreOptions = {
        type: 'Postgres',
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
        buntstift.info('Setting up the PostgreSQL consumer progress store...');

        const store = await createConsumerProgressStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the PostgreSQL consumer progress store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the PostgreSQL consumer progress store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { consumerProgressPostgresCommand };
