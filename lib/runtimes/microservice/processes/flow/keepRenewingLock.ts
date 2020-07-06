import { DomainEventDispatcher } from './DomainEventDispatcher';
import { getPromiseStatus } from '../../../../common/utils/getPromiseStatus';
import { sleep } from '../../../../common/utils/sleep';

const keepRenewingLock = async function ({ flowName, flowPromise, domainEventDispatcher, token }: {
  flowName: string;
  flowPromise: Promise<any>;
  domainEventDispatcher: DomainEventDispatcher;
  token: string;
}): Promise<void> {
  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    await sleep({ ms: domainEventDispatcher.renewalInterval });

    if (await getPromiseStatus(flowPromise) !== 'pending') {
      break;
    }

    await domainEventDispatcher.client.renewLock({
      discriminator: flowName,
      token
    });
  }
};

export { keepRenewingLock };
