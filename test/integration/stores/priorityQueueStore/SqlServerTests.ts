import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { isEqual } from 'lodash';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { SqlServerPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/SqlServer';

suite('SqlServer', (): void => {
  getTestsFor({
    async createPriorityQueueStore ({ suffix, expirationTime }: {
      suffix: string;
      expirationTime: number;
    }): Promise<PriorityQueueStore<any, any>> {
      const tableNames = {
        items: `items_${suffix}`,
        priorityQueue: `priority-queue_${suffix}`
      };

      return await SqlServerPriorityQueueStore.create({
        type: 'SqlServer',
        doesIdentifierMatchItem: ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
        ...connectionOptions.sqlServer,
        tableNames,
        expirationTime
      });
    }
  });
});
