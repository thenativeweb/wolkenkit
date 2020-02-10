import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getAggregatesService } from '../../../../lib/common/services/getAggregatesService';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory/InMemoryDomainEventStore';
import { Repository } from '../../../../lib/common/domain/Repository';
import { uuid } from 'uuidv4';

suite('getAggregatesService', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let applicationDefinition: ApplicationDefinition,
      domainEventStore: DomainEventStore,
      repository: Repository;

  suiteSetup(async (): Promise<void> => {
    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
  });

  setup(async (): Promise<void> => {
    domainEventStore = await InMemoryDomainEventStore.create();

    repository = new Repository({
      applicationDefinition,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' })
    });
  });

  test('returns an AggregatesService if everything is fine.', async (): Promise<void> => {
    const aggregatesService = getAggregatesService({ applicationDefinition, repository });

    assert.that(Object.keys(aggregatesService)).is.equalTo([ 'sampleContext' ]);
    assert.that(Object.keys(aggregatesService.sampleContext!)).is.equalTo([ 'sampleAggregate' ]);
    assert.that(aggregatesService.sampleContext!.sampleAggregate!).is.ofType('function');
  });

  suite('AggregatesService', (): void => {
    test('returns the current state of a requested aggregate.', async (): Promise<void> => {
      const id = uuid();
      const user = {
        id: 'jane.doe',
        claims: {
          sub: 'jane.doe'
        }
      };

      const sampleDomainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id },
        name: 'succeeded',
        data: {},
        metadata: {
          initiator: { user },
          revision: { aggregate: 1 }
        }
      });

      await domainEventStore.storeDomainEvents({ domainEvents: [ sampleDomainEvent ]});

      const aggregatesService = getAggregatesService({ applicationDefinition, repository });
      const sampleAggregateState = await aggregatesService.sampleContext!.sampleAggregate!(id).read();

      assert.that(sampleAggregateState).is.equalTo({
        domainEventNames: [ 'succeeded' ]
      });
    });

    test('throws an error if a requested aggregate does not exist.', async (): Promise<void> => {
      const aggregatesService = getAggregatesService({ applicationDefinition, repository });
      const id = uuid();

      await assert.that(async (): Promise<void> => {
        await aggregatesService.sampleContext!.sampleAggregate!(id).read();
      }).is.throwingAsync(`Aggregate 'sampleContext.sampleAggregate.${id}' not found.`);
    });
  });
});
