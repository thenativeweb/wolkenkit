import { Command } from 'command-line-interface';
import { consumerProgressMongoDbCommand } from './consumerProgressMongoDbCommand';
import { RootOptions } from '../../../RootOptions';

const consumerProgressCommand = function (): Command<RootOptions> {
  return {
    name: 'consumer-progress',
    description: 'Sets up a consumer progress store.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'store' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      mongodb: consumerProgressMongoDbCommand()
    }
  };
};

export { consumerProgressCommand };
