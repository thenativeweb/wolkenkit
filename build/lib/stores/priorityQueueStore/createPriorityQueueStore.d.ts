import { PriorityQueueStore } from './PriorityQueueStore';
import { PriorityQueueStoreOptions } from './PriorityQueueStoreOptions';
declare const createPriorityQueueStore: <TItem extends object, TItemIdentifier>(options: PriorityQueueStoreOptions<TItem, TItemIdentifier>) => Promise<PriorityQueueStore<TItem, TItemIdentifier>>;
export { createPriorityQueueStore };
