import { buildCommand } from './build/buildCommand';
import { Command } from 'command-line-interface';
import { devCommand } from './dev/devCommand';
import { documentationCommand } from './documentation/documentationCommand';
import { healthCommand } from './health/healthCommand';
import { initCommand } from './init/initCommand';
import { replayCommand } from './replay/replayCommand';
import { RootOptions } from './RootOptions';
import { setupCommand } from './setup/setupCommand';
import { tokenCommand } from './token/tokenCommand';

const rootCommand = function (): Command<RootOptions> {
  return {
    name: 'wolkenkit',
    description: 'Manages wolkenkit.',

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
      console.log(getUsage({ commandPath: [ 'wolkenkit' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      init: initCommand(),
      dev: devCommand(),
      build: buildCommand(),
      documentation: documentationCommand(),
      health: healthCommand(),
      setup: setupCommand(),
      replay: replayCommand(),
      token: tokenCommand()
    }
  };
};

export { rootCommand };
