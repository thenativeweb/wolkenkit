import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getTestsFor } from './getTestsFor';
import { MariaDbDomainEventStore } from '../../../../lib/stores/domainEventStore/MariaDb';

suite('MariaDb', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: {
      suffix: string;
    }): Promise<DomainEventStore> {
      return await MariaDbDomainEventStore.create({
        ...connectionOptions.mariaDb,
        tableNames: {
          domainEvents: `domainevents_${suffix}`,
          snapshots: `snapshots_${suffix}`
        }
      });
    }
  });
});
