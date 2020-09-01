import { Command } from 'command-line-interface';
import { consumerProgressCommand } from './consumerProgress/consumerProgressCommand';
import { domainEventCommand } from './domainEvent/domainEventCommand';
import { fileCommand } from './file/fileCommand';
import { lockCommand } from './lock/lockCommand';
import { priorityQueueCommand } from './priorityQueue/priorityQueueCommand';
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
      'consumer-progress': consumerProgressCommand(),
      'domain-event': domainEventCommand(),
      file: fileCommand(),
      lock: lockCommand(),
      'priority-queue': priorityQueueCommand()
    }
  };
};

export { storeCommand };
