import { ObservableItem } from './PriorityQueueObserver';
import { PriorityQueueStoreOptions } from '../PriorityQueueStoreOptions';

interface PriorityQueueObserverOptions {
  type: 'observer';
  observedQueueOptions: PriorityQueueStoreOptions<ObservableItem, string>;
}

export type {
  PriorityQueueObserverOptions
};
