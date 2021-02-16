import { Command } from 'command-line-interface';
import { consumerProgressMongoDbCommand } from './consumerProgressMongoDbCommand';
import { consumerProgressMySqlCommand } from './consumerProgressMySqlCommand';
import { consumerProgressPostgresCommand } from './consumerProgressPostgresCommand';
import { consumerProgressSqlServerCommand } from './consumerProgressSqlServerCommand';
import { RootOptions } from '../../../RootOptions';

const consumerProgressCommand = function (): Command<RootOptions> {
  return {
    name: 'consumer-progress',
    description: 'Set up a consumer progress store.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'consumer-progress' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      mongodb: consumerProgressMongoDbCommand(),
      mysql: consumerProgressMySqlCommand(),
      postgres: consumerProgressPostgresCommand(),
      sqlserver: consumerProgressSqlServerCommand()
    }
  };
};

export { consumerProgressCommand };
