import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { PostgresPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/Postgres';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('Postgres', (): void => {
  getTestsFor({
    async createPriorityQueueStore ({ suffix, expirationTime }: {
      suffix: string;
      expirationTime: number;
    }): Promise<PriorityQueueStore<any>> {
      const tableNames = {
        items: `items_${suffix}`,
        priorityQueue: `priorityQueue_${suffix}`
      };

      return await PostgresPriorityQueueStore.create({
        ...connectionOptions.postgres,
        tableNames,
        expirationTime
      });
    }
  });
});
