import { connectionOptions } from '../../shared/containers/connectionOptions';
import { getLoadTestsFor } from './getLoadTestsFor';
import { isEqual } from 'lodash';
import { PostgresPriorityQueueStore } from '../../../lib/stores/priorityQueueStore/Postgres';
import { PriorityQueueStore } from '../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('Postgres', (): void => {
  getLoadTestsFor({
    async createPriorityQueueStore ({ suffix, expirationTime }: {
      suffix: string;
      expirationTime: number;
    }): Promise<PriorityQueueStore<any, any>> {
      const tableNames = {
        items: `items_${suffix}`,
        priorityQueue: `priority-queue_${suffix}`
      };

      return await PostgresPriorityQueueStore.create({
        type: 'Postgres',
        doesIdentifierMatchItem: ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
        ...connectionOptions.postgres,
        tableNames,
        expirationTime
      });
    },
    queueType: 'Postgres'
  });
});
