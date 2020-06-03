import { getTestsFor } from './getTestsFor';
import { InMemoryPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/InMemory';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('InMemory', (): void => {
  getTestsFor({
    async createPriorityQueueStore ({ expirationTime }: {
      expirationTime: number;
    }): Promise<PriorityQueueStore<any>> {
      return await InMemoryPriorityQueueStore.create({ expirationTime });
    }
  });
});
