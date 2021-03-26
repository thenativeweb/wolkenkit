import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getTestsFor } from './getTestsFor';
import { SqlServerDomainEventStore } from '../../../../lib/stores/domainEventStore/SqlServer';

suite('SqlServer', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: {
      suffix: string;
    }): Promise<DomainEventStore> {
      return await SqlServerDomainEventStore.create({
        type: 'SqlServer',
        ...connectionOptions.sqlServer,
        tableNames: {
          domainEvents: `domain-events_${suffix}`,
          snapshots: `snapshots_${suffix}`
        }
      });
    }
  });
});
