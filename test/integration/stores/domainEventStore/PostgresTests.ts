import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getTestsFor } from './getTestsFor';
import { PostgresDomainEventStore } from '../../../../lib/stores/domainEventStore/Postgres';

suite('Postgres', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: {
      suffix: string;
    }): Promise<DomainEventStore> {
      return await PostgresDomainEventStore.create({
        ...connectionOptions.postgres,
        tableNames: {
          domainEvents: `domainevents_${suffix}`,
          snapshots: `snapshots_${suffix}`
        }
      });
    }
  });
});
