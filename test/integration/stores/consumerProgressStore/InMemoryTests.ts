import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { getTestsFor } from './getTestsFor';
import { InMemoryConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/InMemory';

suite('InMemory', (): void => {
  getTestsFor({
    async createConsumerProgressStore (): Promise<ConsumerProgressStore> {
      return await InMemoryConsumerProgressStore.create();
    }
  });
});
