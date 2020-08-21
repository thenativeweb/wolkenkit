import { Command } from 'command-line-interface';
import { infrastructureCommand } from './infrastructure/infrastructureCommand';
import { RootOptions } from '../RootOptions';
import { storeCommand } from './store/storeCommand';

const setupCommand = function (): Command<RootOptions> {
  return {
    name: 'setup',
    description: 'Sets up various infrastructure.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'setup' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      infrastructure: infrastructureCommand(),
      store: storeCommand()
    }
  };
};

export { setupCommand };
