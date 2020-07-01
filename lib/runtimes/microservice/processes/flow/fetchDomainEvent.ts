import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventDispatcher } from './DomainEventDispatcher';
import { LockMetadata } from '../../../../stores/priorityQueueStore/LockMetadata';
import { retry } from 'retry-ignore-abort';

const fetchDomainEvent = async function ({ domainEventDispatcher }: {
  domainEventDispatcher: DomainEventDispatcher;
}): Promise<{
    domainEvent: DomainEvent<DomainEventData>;
    metadata: LockMetadata;
  }> {
  const { item, metadata } = await retry(
    async (): Promise<{
      item: DomainEvent<DomainEventData>;
      metadata: LockMetadata;
    }> => await domainEventDispatcher.client.awaitItem(),
    { retries: Number.POSITIVE_INFINITY, minTimeout: 10, maxTimeout: 1000 }
  );

  return { domainEvent: item, metadata };
};

export {
  fetchDomainEvent
};
