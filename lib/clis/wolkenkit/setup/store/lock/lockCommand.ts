import { Command } from 'command-line-interface';
import { lockMongoDbCommand } from './lockMongoDbCommand';
import { lockMySqlCommand } from './lockMySqlCommand';
import { RootOptions } from '../../../RootOptions';

const lockCommand = function (): Command<RootOptions> {
  return {
    name: 'lock',
    description: 'Sets up a lock store.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'store' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      mongodb: lockMongoDbCommand(),
      mysql: lockMySqlCommand()
    }
  };
};

export { lockCommand };
