import { buildCommand } from './build/buildCommand';
import { Command } from 'command-line-interface';
import { DocumentationOptions } from './DocumentationOptions';
import { runCommand } from './run/runCommand';

const documentationCommand = function (): Command<DocumentationOptions> {
  return {
    name: 'documentation',
    description: 'Manage the documentation.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'documentation' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      run: runCommand(),
      build: buildCommand()
    }
  };
};

export { documentationCommand };
