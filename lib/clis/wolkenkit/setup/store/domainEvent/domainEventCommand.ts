import { Command } from 'command-line-interface';
import { domainEventMongoDbCommand } from './domainEventMongoDbCommand';
import { RootOptions } from '../../../RootOptions';

const domainEventCommand = function (): Command<RootOptions> {
  return {
    name: 'domain-event',
    description: 'Sets up a domain event store.',

    optionDefinitions: [],

    handle ({ getUsage, ancestors }): void {
      /* eslint-disable no-console */
      console.log(getUsage({ commandPath: [ ...ancestors, 'store' ]}));
      /* eslint-enable no-console */
    },

    subcommands: {
      mongodb: domainEventMongoDbCommand()
    }
  };
};

export { domainEventCommand };
