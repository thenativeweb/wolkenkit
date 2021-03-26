import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getTestsFor } from './getTestsFor';
import { MongoDbDomainEventStore } from '../../../../lib/stores/domainEventStore/MongoDb';

suite('MongoDb', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: {
      suffix: string;
    }): Promise<DomainEventStore> {
      return await MongoDbDomainEventStore.create({
        type: 'MongoDb',
        ...connectionOptions.mongoDb,
        collectionNames: {
          domainEvents: `domain-events_${suffix}`,
          snapshots: `snapshots_${suffix}`
        }
      });
    }
  });
});
