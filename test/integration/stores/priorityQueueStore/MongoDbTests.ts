import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getLoadTestsFor } from './getLoadTestsFor';
import { getTestsFor } from './getTestsFor';
import { isEqual } from 'lodash';
import { MongoDbPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/MongoDb';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('MongoDb', (): void => {
  suite('general tests', (): void => {
    getTestsFor({
      async createPriorityQueueStore ({ suffix, expirationTime }: {
        suffix: string;
        expirationTime: number;
      }): Promise<PriorityQueueStore<any, any>> {
        const collectionNames = {
          queues: `queues_${suffix}`
        };

        return await MongoDbPriorityQueueStore.create({
          type: 'MongoDb',
          doesIdentifierMatchItem: ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
          ...connectionOptions.mongoDb,
          collectionNames,
          expirationTime
        });
      }
    });
  });

  suite('load tests', (): void => {
    getLoadTestsFor({
      async createPriorityQueueStore ({ suffix, expirationTime }: {
        suffix: string;
        expirationTime: number;
      }): Promise<PriorityQueueStore<any, any>> {
        const collectionNames = {
          queues: `queues_${suffix}`
        };

        return await MongoDbPriorityQueueStore.create({
          type: 'MongoDb',
          doesIdentifierMatchItem: ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
          ...connectionOptions.mongoDb,
          collectionNames,
          expirationTime
        });
      },
      queueType: 'MongoDb'
    });
  });
});
