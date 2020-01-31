import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getTestsFor } from './getTestsFor';
import { PostgresNoLockDomainEventStore } from '../../../../lib/stores/domainEventStore/PostgresNoLock';

suite('Postgres No Lock', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: {
      suffix: string;
    }): Promise<DomainEventStore> {
      return await PostgresNoLockDomainEventStore.create({
        ...connectionOptions.postgres,
        tableNames: {
          domainEvents: `domainevents_${suffix}`,
          snapshots: `snapshots_${suffix}`
        }
      });
    }
  });
});
