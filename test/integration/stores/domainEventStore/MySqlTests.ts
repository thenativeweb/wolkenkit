import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getTestsFor } from './getTestsFor';
import { MySqlDomainEventStore } from '../../../../lib/stores/domainEventStore/MySql';

suite('MySql', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: {
      suffix: string;
    }): Promise<DomainEventStore> {
      return await MySqlDomainEventStore.create({
        type: 'MySql',
        ...connectionOptions.mySql,
        tableNames: {
          domainEvents: `domain-events_${suffix}`,
          snapshots: `snapshots_${suffix}`
        }
      });
    }
  });
});
