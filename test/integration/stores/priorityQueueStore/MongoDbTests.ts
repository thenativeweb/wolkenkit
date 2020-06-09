import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { getTestsFor } from './getTestsFor';
import { MongoDbPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/MongoDb';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';

suite('MongoDb', (): void => {
  getTestsFor({
    async createPriorityQueueStore ({ suffix, expirationTime }: {
      suffix: string;
      expirationTime: number;
    }): Promise<PriorityQueueStore<any>> {
      const collectionNames = {
        queues: `queues_${suffix}`
      };

      return await MongoDbPriorityQueueStore.create({
        ...connectionOptions.mongoDb,
        collectionNames,
        expirationTime
      });
    }
  });
});
