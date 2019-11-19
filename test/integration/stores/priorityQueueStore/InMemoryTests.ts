import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { getTestsFor } from './getTestsFor';
import { InMemoryPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/InMemory';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('InMemory', (): void => {
  getTestsFor({
    async createPriorityQueueStore ({ expirationTime }: {
      expirationTime: number;
    }): Promise<PriorityQueueStore<CommandWithMetadata<CommandData>>> {
      return await InMemoryPriorityQueueStore.create({ expirationTime });
    }
  });
});
