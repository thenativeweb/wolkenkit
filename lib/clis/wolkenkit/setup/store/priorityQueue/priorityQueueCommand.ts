import { Command } from 'command-line-interface';
import { priorityQueueMongoDbCommand } from './priorityQueueMongoDbCommand';
import { priorityQueueMySqlCommand } from './priorityQueueMySqlCommand';
import { priorityQueuePostgresCommand } from './priorityQueuePostgresCommand';
import { priorityQueueSqlServerCommand } from './priorityQueueSqlServerCommand';
import { RootOptions } from '../../../RootOptions';

const priorityQueueCommand = function (): Command<RootOptions> {
  return {
    name: 'priority-queue',
    description: 'Set up a priority queue store.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'priority-queue' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      mongodb: priorityQueueMongoDbCommand(),
      mysql: priorityQueueMySqlCommand(),
      postgres: priorityQueuePostgresCommand(),
      sqlserver: priorityQueueSqlServerCommand()
    }
  };
};

export { priorityQueueCommand };
