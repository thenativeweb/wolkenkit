import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventDispatcher } from './DomainEventDispatcher';
import { LockMetadata } from '../../../../stores/priorityQueueStore/LockMetadata';
declare const fetchDomainEvent: ({ domainEventDispatcher }: {
    domainEventDispatcher: DomainEventDispatcher;
}) => Promise<{
    domainEvent: DomainEvent<DomainEventData>;
    metadata: LockMetadata;
}>;
export { fetchDomainEvent };
