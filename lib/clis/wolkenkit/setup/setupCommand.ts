import { Command } from 'command-line-interface';
import { infrastructureCommand } from './infrastructure/infrastructureCommand';
import { RootOptions } from '../RootOptions';
import { storeCommand } from './store/storeCommand';

const setupCommand = function (): Command<RootOptions> {
  return {
    name: 'setup',
    description: 'Set up the environment.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      // eslint-disable-next-line no-console
      console.log(getUsage({ commandPath: [ ...ancestors, 'setup' ]}));
    },

    subcommands: {
      infrastructure: infrastructureCommand(),
      store: storeCommand()
    }
  };
};

export { setupCommand };
