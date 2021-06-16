import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
export interface InMemoryPriorityQueueStoreOptions<TItem, TItemIdentifier> {
    type: 'InMemory';
    doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    expirationTime?: number;
}
