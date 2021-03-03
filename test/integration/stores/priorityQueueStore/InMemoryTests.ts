import { getLoadTestsFor } from './getLoadTestsFor';
import { getTestsFor } from './getTestsFor';
import { InMemoryPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/InMemory';
import { isEqual } from 'lodash';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('InMemory', (): void => {
  suite('general tests', (): void => {
    getTestsFor({
      async createPriorityQueueStore ({ expirationTime }: {
        expirationTime: number;
      }): Promise<PriorityQueueStore<any, any>> {
        return await InMemoryPriorityQueueStore.create({
          type: 'InMemory',
          doesIdentifierMatchItem: ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
          expirationTime
        });
      }
    });
  });

  suite.only('load tests', (): void => {
    getLoadTestsFor({
      async createPriorityQueueStore ({ expirationTime }: {
        expirationTime: number;
      }): Promise<PriorityQueueStore<any, any>> {
        return await InMemoryPriorityQueueStore.create({
          type: 'InMemory',
          doesIdentifierMatchItem: ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
          expirationTime
        });
      },
      queueType: 'InMemory'
    });
  });
});
