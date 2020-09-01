import { Command } from 'command-line-interface';
import { fileFileSystemCommand } from './fileFileSystemCommand';
import { fileS3Command } from './fileS3Command';
import { RootOptions } from '../../../RootOptions';

const fileCommand = function (): Command<RootOptions> {
  return {
    name: 'file',
    description: 'Sets up a file store.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'file' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      'file-system': fileFileSystemCommand(),
      s3: fileS3Command()
    }
  };
};

export { fileCommand };
