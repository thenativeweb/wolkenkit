import { buildCommand } from './build/buildCommand';
import { Command } from 'command-line-interface';
import { createDeploymentCommand } from './createDeployment/createDeploymentCommand';
import { devCommand } from './dev/devCommand';
import { documentationCommand } from './documentation/documentationCommand';
import { initCommand } from './init/initCommand';
import { RootOptions } from './RootOptions';
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
      'create-deployment': createDeploymentCommand(),
      documentation: documentationCommand(),
      token: tokenCommand()
    }
  };
};

export { rootCommand };
