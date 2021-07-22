import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createDomainEventStore } from '../../../../../stores/domainEventStore/createDomainEventStore';
import { DomainEventPostgresOptions } from './DomainEventPostgresOptions';
import { DomainEventStoreOptions } from '../../../../../stores/domainEventStore/DomainEventStoreOptions';
import { getPostgresConnectionOptionsSchema } from '../../../../../stores/utils/postgres/getPostgresConnectionOptionsSchema';
import { parse } from 'validate-value';
import { PostgresConnectionOptions } from '../../../../../stores/utils/postgres/PostgresConnectionOptions';

const domainEventPostgresCommand = function (): Command<DomainEventPostgresOptions> {
  return {
    name: 'postgres',
    description: 'Set up a PostgreSQL domain event store.',

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
        name: 'table-name-domain-events',
        type: 'string',
        defaultValue: 'domain-events'
      },
      {
        name: 'table-name-snapshots',
        type: 'string',
        defaultValue: 'snapshots'
      }
    ],

    async handle ({ options: {
      'host-name': hostName,
      port,
      'user-name': userName,
      password,
      database,
      'encrypt-connection': rawEncryptConnection,
      'table-name-domain-events': tableNameDomainEvents,
      'table-name-snapshots': tableNameSnapshots,
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

      const storeOptions: DomainEventStoreOptions = {
        type: 'Postgres',
        hostName,
        port,
        userName,
        password,
        database,
        encryptConnection,
        tableNames: {
          domainEvents: tableNameDomainEvents,
          snapshots: tableNameSnapshots
        }
      };

      try {
        buntstift.info('Setting up the PostgreSQL domain event store...');

        const store = await createDomainEventStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the PostgreSQL domain event store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the PostgreSQL domain event store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { domainEventPostgresCommand };
