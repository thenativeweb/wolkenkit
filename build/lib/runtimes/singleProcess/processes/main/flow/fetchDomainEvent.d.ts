import { DomainEvent } from '../../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../../common/elements/DomainEventData';
import { FlowPriorityQueue } from './FlowPriorityQueue';
import { LockMetadata } from '../../../../../stores/priorityQueueStore/LockMetadata';
declare const fetchDomainEvent: ({ priorityQueue }: {
    priorityQueue: FlowPriorityQueue;
}) => Promise<{
    domainEvent: DomainEvent<DomainEventData>;
    metadata: LockMetadata;
}>;
export { fetchDomainEvent };
