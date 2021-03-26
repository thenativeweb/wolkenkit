import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { isEqual } from 'lodash';
import { MySqlPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/MySql';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('MySql', (): void => {
  getTestsFor({
    async createPriorityQueueStore ({ suffix, expirationTime }: {
      suffix: string;
      expirationTime: number;
    }): Promise<PriorityQueueStore<any, any>> {
      const tableNames = {
        items: `items_${suffix}`,
        priorityQueue: `priority-queue_${suffix}`
      };

      return await MySqlPriorityQueueStore.create({
        type: 'MySql',
        doesIdentifierMatchItem: ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
        ...connectionOptions.mySql,
        tableNames,
        expirationTime
      });
    }
  });
});
