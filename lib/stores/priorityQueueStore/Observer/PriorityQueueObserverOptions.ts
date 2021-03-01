import { PriorityQueueStoreOptions } from '../PriorityQueueStoreOptions';
import { Item } from './PriorityQueueObserver';

interface PriorityQueueObserverOptions {
  type: 'observer';
  observedQueueOptions: PriorityQueueStoreOptions<Item, string>;
}

export type {
  PriorityQueueObserverOptions
};
