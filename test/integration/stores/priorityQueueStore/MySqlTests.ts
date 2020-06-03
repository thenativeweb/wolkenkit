import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { MySqlPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/MySql';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('MySql', (): void => {
  getTestsFor({
    async createPriorityQueueStore ({ suffix, expirationTime }: {
      suffix: string;
      expirationTime: number;
    }): Promise<PriorityQueueStore<any>> {
      const tableNames = {
        items: `items_${suffix}`,
        priorityQueue: `priorityQueue_${suffix}`
      };

      return await MySqlPriorityQueueStore.create({
        ...connectionOptions.mySql,
        tableNames,
        expirationTime
      });
    }
  });
});
