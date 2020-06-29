import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { getTestsFor } from './getTestsFor';
import { PostgresConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/Postgres';

suite('Postgres', (): void => {
  getTestsFor({
    async createConsumerProgressStore ({ suffix }: {
      suffix: string;
    }): Promise<ConsumerProgressStore> {
      return await PostgresConsumerProgressStore.create({
        ...connectionOptions.postgres,
        collectionNames: {
          progress: `progress_${suffix}`
        }
      });
    }
  });
});
