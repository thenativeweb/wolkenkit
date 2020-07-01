import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventDispatcher } from './DomainEventDispatcher';
import { getPromiseStatus } from '../../../../common/utils/getPromiseStatus';
import { sleep } from '../../../../common/utils/sleep';

const keepRenewingLock = async function ({ domainEvent, flowPromise, domainEventDispatcher, token }: {
  domainEvent: DomainEvent<DomainEventData>;
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
      itemIdentifier: domainEvent.getItemIdentifier(),
      token
    });
  }
};

export { keepRenewingLock };
