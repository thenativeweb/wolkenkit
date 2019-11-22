import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getTestsFor } from './getTestsFor';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory';

suite('InMemory', (): void => {
  getTestsFor({
    async createDomainEventStore (): Promise<DomainEventStore> {
      return await InMemoryDomainEventStore.create();
    }
  });
});
