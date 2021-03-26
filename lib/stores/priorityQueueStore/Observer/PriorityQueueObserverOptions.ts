import { PriorityQueueStoreOptions } from '../PriorityQueueStoreOptions';

interface PriorityQueueObserverOptions<TItem extends object, TItemIdentifier extends object> {
  type: 'observer';
  observedQueueOptions: PriorityQueueStoreOptions<TItem, TItemIdentifier>;
}

export type {
  PriorityQueueObserverOptions
};
