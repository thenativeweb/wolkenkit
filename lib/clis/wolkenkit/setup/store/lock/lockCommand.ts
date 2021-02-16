import { Command } from 'command-line-interface';
import { lockMongoDbCommand } from './lockMongoDbCommand';
import { lockMySqlCommand } from './lockMySqlCommand';
import { lockPostgresCommand } from './lockPostgresCommand';
import { lockRedisCommand } from './lockRedisCommand';
import { lockSqlServerCommand } from './lockSqlServerCommand';
import { RootOptions } from '../../../RootOptions';

const lockCommand = function (): Command<RootOptions> {
  return {
    name: 'lock',
    description: 'Set up a lock store.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'lock' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      mongodb: lockMongoDbCommand(),
      mysql: lockMySqlCommand(),
      postgres: lockPostgresCommand(),
      redis: lockRedisCommand(),
      sqlserver: lockSqlServerCommand()
    }
  };
};

export { lockCommand };
