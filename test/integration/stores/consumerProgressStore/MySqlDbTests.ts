import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { getTestsFor } from './getTestsFor';
import { MySqlConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/MySql';

suite('MySql', (): void => {
  getTestsFor({
    async createConsumerProgressStore ({ suffix }: {
      suffix: string;
    }): Promise<ConsumerProgressStore> {
      return await MySqlConsumerProgressStore.create({
        ...connectionOptions.mySql,
        tableNames: {
          progress: `progress_${suffix}`
        }
      });
    }
  });
});
