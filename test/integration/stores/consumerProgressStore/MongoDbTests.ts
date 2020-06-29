import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { getTestsFor } from './getTestsFor';
import { MongoDbConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/MongoDb';

suite('MongoDb', (): void => {
  getTestsFor({
    async createConsumerProgressStore ({ suffix }: {
      suffix: string;
    }): Promise<ConsumerProgressStore> {
      return await MongoDbConsumerProgressStore.create({
        ...connectionOptions.mongoDb,
        collectionNames: {
          progress: `progress_${suffix}`
        }
      });
    }
  });
});
