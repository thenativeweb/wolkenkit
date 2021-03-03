import { connectionOptions } from '../../shared/containers/connectionOptions';
import { getLoadTestsFor } from './getLoadTestsFor';
import { isEqual } from 'lodash';
import { MySqlPriorityQueueStore } from '../../../lib/stores/priorityQueueStore/MySql';
import { PriorityQueueStore } from '../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('MariaDb', (): void => {
  getLoadTestsFor({
    async createPriorityQueueStore ({ suffix, expirationTime }: {
      suffix: string;
      expirationTime: number;
    }): Promise<PriorityQueueStore<any, any>> {
      return await MySqlPriorityQueueStore.create({
        type: 'MariaDb',
        doesIdentifierMatchItem: ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
        ...connectionOptions.mariaDb,
        tableNames: {
          items: `items_${suffix}`,
          priorityQueue: `priorityQueue_${suffix}`
        },
        expirationTime
      });
    },
    queueType: 'MariaDb'
  });
});
