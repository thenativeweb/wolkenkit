import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventDispatcher } from './DomainEventDispatcher';
import { retry } from 'retry-ignore-abort';

const acknowledgeDomainEvent = async function ({ domainEvent, token, domainEventDispatcher }: {
  domainEvent: DomainEvent<DomainEventData>;
  token: string;
  domainEventDispatcher: DomainEventDispatcher;
}): Promise<void> {
  await retry(async (): Promise<void> => {
    await domainEventDispatcher.client.acknowledge({
      itemIdentifier: domainEvent.getItemIdentifier(),
      token
    });
  }, { retries: domainEventDispatcher.acknowledgeRetries, maxTimeout: 1000 });
};

export {
  acknowledgeDomainEvent
};
