import { Command } from 'command-line-interface';
import { verifyCommand } from './verify/verifyCommand';
import { VersionsOptions } from './VersionsOptions';

const versionsCommand = function (): Command<VersionsOptions> {
  return {
    name: 'versions',
    description: 'Manage versions.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'versions' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      verify: verifyCommand()
    }
  };
};

export { versionsCommand };
