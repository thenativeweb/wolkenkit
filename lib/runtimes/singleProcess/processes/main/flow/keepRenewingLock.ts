import { FlowPriorityQueue } from './FlowPriorityQueue';
import { getPromiseStatus } from '../../../../../common/utils/getPromiseStatus';
import { sleep } from '../../../../../common/utils/sleep';

const keepRenewingLock = async function ({ flowName, flowPromise, priorityQueue, token }: {
  flowName: string;
  flowPromise: Promise<any>;
  priorityQueue: FlowPriorityQueue;
  token: string;
}): Promise<void> {
  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    await sleep({ ms: priorityQueue.renewalInterval });

    if (await getPromiseStatus(flowPromise) !== 'pending') {
      break;
    }

    await priorityQueue.store.renewLock({
      discriminator: flowName,
      token
    });
  }
};

export { keepRenewingLock };
