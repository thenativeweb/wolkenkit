import { CommandData } from '../../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../common/elements/CommandWithMetadata';
import { DomainPriorityQueue } from './DomainPriorityQueue';
import { getPromiseStatus } from '../../../../../common/utils/getPromiseStatus';
import { sleep } from '../../../../../common/utils/sleep';

const keepRenewingLock = async function ({ command, handleCommandPromise, priorityQueue, token }: {
  command: CommandWithMetadata<CommandData>;
  handleCommandPromise: Promise<any>;
  priorityQueue: DomainPriorityQueue;
  token: string;
}): Promise<void> {
  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    await sleep({ ms: priorityQueue.renewalInterval });

    if (await getPromiseStatus(handleCommandPromise) !== 'pending') {
      break;
    }

    await priorityQueue.store.renewLock({
      discriminator: command.aggregateIdentifier.aggregate.id,
      token
    });
  }
};

export { keepRenewingLock };
