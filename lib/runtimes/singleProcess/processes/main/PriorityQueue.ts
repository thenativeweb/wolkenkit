import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';

export interface PriorityQueue {
  store: PriorityQueueStore<CommandWithMetadata<CommandData>>;
  renewalInterval: number;
}
