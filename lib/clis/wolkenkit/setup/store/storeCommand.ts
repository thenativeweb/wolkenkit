import { Command } from 'command-line-interface';
import { consumerProgressCommand } from './consumerProgress/consumerProgressCommand';
import { RootOptions } from '../../RootOptions';

const storeCommand = function (): Command<RootOptions> {
  return {
    name: 'store',
    description: 'Sets up various stores.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'store' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      'consumer-progress': consumerProgressCommand()
    }
  };
};

export { storeCommand };
