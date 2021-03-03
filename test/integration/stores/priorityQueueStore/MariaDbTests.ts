import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getLoadTestsFor } from './getLoadTestsFor';
import { getTestsFor } from './getTestsFor';
import { isEqual } from 'lodash';
import { MySqlPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/MySql';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('MariaDb', (): void => {
  suite('general tests', (): void => {
    getTestsFor({
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
      }
    });
  });

  suite.only('load tests', (): void => {
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
});
