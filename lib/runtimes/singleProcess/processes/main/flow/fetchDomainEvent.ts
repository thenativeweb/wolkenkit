import { DomainEvent } from '../../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../../common/elements/DomainEventData';
import { FlowPriorityQueue } from './FlowPriorityQueue';
import { LockMetadata } from '../../../../../stores/priorityQueueStore/LockMetadata';
import { retry } from 'retry-ignore-abort';

const fetchDomainEvent = async function ({ priorityQueue }: {
  priorityQueue: FlowPriorityQueue;
}): Promise<{
    domainEvent: DomainEvent<DomainEventData>;
    metadata: LockMetadata;
  }> {
  const { item, metadata } = await retry(
    async (): Promise<{
      item: DomainEvent<DomainEventData>;
      metadata: LockMetadata;
    }> => {
      const lock = await priorityQueue.store.lockNext();

      if (lock === undefined) {
        throw new Error('Command queue is empty.');
      }

      return lock;
    },
    { retries: Number.POSITIVE_INFINITY, minTimeout: 10, maxTimeout: 500 }
  );

  return { domainEvent: new DomainEvent<DomainEventData>(item), metadata };
};

export {
  fetchDomainEvent
};
