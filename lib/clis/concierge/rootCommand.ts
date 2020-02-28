import { Command } from 'command-line-interface';
import { documentationCommand } from './documentation/documentationCommand';
import { RootOptions } from './RootOptions';
import { versionsCommand } from './versions/versionsCommand';

const rootCommand = function (): Command<RootOptions> {
  return {
    name: 'concierge',
    description: 'Manages wolkenkit development.',

    optionDefinitions: [
      {
        name: 'verbose',
        alias: 'v',
        description: 'enable verbose mode',
        type: 'boolean',
        isRequired: false,
        defaultValue: false
      }
    ],

    handle ({ getUsage }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ 'concierge' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      documentation: documentationCommand(),
      versions: versionsCommand()
    }
  };
};

export { rootCommand };
