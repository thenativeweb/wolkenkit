import { DomainEvent } from '../../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../../common/elements/DomainEventData';
import { ItemIdentifierWithClient } from '../../../../../common/elements/ItemIdentifierWithClient';
import { PriorityQueueStore } from '../../../../../stores/priorityQueueStore/PriorityQueueStore';
export interface FlowPriorityQueue {
    store: PriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifierWithClient>;
    renewalInterval: number;
}
