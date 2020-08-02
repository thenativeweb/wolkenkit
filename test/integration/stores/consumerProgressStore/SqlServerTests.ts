import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { getTestsFor } from './getTestsFor';
import { SqlServerConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/SqlServer';

suite('SqlServer', (): void => {
  getTestsFor({
    async createConsumerProgressStore ({ suffix }: {
      suffix: string;
    }): Promise<ConsumerProgressStore> {
      return await SqlServerConsumerProgressStore.create({
        type: 'SqlServer',
        ...connectionOptions.sqlServer,
        tableNames: {
          progress: `progress_${suffix}`
        }
      });
    }
  });
});
