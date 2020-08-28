import { Command } from 'command-line-interface';
import { domainEventMongoDbCommand } from './domainEventMongoDbCommand';
import { domainEventMySqlCommand } from './domainEventMySqlCommand';
import { domainEventPostgresCommand } from './domainEventPostresCommand';
import { domainEventSqlServerCommand } from './domainEventSqlServerCommand';
import { RootOptions } from '../../../RootOptions';

const domainEventCommand = function (): Command<RootOptions> {
  return {
    name: 'domain-event',
    description: 'Sets up a domain event store.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'domain-event' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      mongodb: domainEventMongoDbCommand(),
      mysql: domainEventMySqlCommand(),
      postgres: domainEventPostgresCommand(),
      sqlserver: domainEventSqlServerCommand()
    }
  };
};

export { domainEventCommand };
