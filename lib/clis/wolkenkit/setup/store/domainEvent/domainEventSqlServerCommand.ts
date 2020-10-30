import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createDomainEventStore } from '../../../../../stores/domainEventStore/createDomainEventStore';
import { DomainEventSqlServerOptions } from './DomainEventSqlServerOptions';
import { DomainEventStoreOptions } from '../../../../../stores/domainEventStore/DomainEventStoreOptions';

const domainEventSqlServerCommand = function (): Command<DomainEventSqlServerOptions> {
  return {
    name: 'sqlserver',
    description: 'Set up a SQL Server domain event store.',

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
        name: 'table-name-domain-events',
        type: 'string',
        defaultValue: 'domainEvents'
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
      'encrypt-connection': encryptConnection,
      'table-name-domain-events': tableNameDomainEvents,
      'table-name-snapshots': tableNameSnapshots,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: DomainEventStoreOptions = {
        type: 'SqlServer',
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
        buntstift.info('Setting up the SQL Server domain event store...');

        const store = await createDomainEventStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the SQL Server domain event store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the SQL Server domain event store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { domainEventSqlServerCommand };
