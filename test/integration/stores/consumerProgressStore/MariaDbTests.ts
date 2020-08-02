import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { getTestsFor } from './getTestsFor';
import { MySqlConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/MySql';

suite('MariaDb', (): void => {
  getTestsFor({
    async createConsumerProgressStore ({ suffix }: {
      suffix: string;
    }): Promise<ConsumerProgressStore> {
      return await MySqlConsumerProgressStore.create({
        type: 'MariaDb',
        ...connectionOptions.mariaDb,
        tableNames: {
          progress: `progress_${suffix}`
        }
      });
    }
  });
});
