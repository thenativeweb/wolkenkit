import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { getPromiseStatus } from '../../../../common/utils/getPromiseStatus';
import { PriorityQueue } from './PriorityQueue';
import { sleep } from '../../../../common/utils/sleep';

const keepRenewingLock = async function ({ command, handleCommandPromise, priorityQueue, token }: {
  command: CommandWithMetadata<CommandData>;
  handleCommandPromise: Promise<void>;
  priorityQueue: PriorityQueue;
  token: string;
}): Promise<void> {
  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    await sleep({ ms: priorityQueue.renewalInterval });

    if (await getPromiseStatus(handleCommandPromise) !== 'pending') {
      break;
    }

    await priorityQueue.store.renewLock({
      itemIdentifier: command.getItemIdentifier(),
      token
    });
  }
};

export { keepRenewingLock };
