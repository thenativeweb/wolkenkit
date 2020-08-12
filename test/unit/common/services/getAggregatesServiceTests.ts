import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { createLockStore } from '../../../../lib/stores/lockStore/createLockStore';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getAggregatesService } from '../../../../lib/common/services/getAggregatesService';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { Notification } from '../../../../lib/common/elements/Notification';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Repository } from '../../../../lib/common/domain/Repository';
import { v4 } from 'uuid';

suite('getAggregatesService', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let application: Application,
      domainEventStore: DomainEventStore,
      lockStore: LockStore,
      publisher: Publisher<Notification>,
      pubSubChannelForNotifications: string,
      repository: Repository;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });
  });

  setup(async (): Promise<void> => {
    domainEventStore = await InMemoryDomainEventStore.create({ type: 'InMemory' });
    lockStore = await createLockStore({ type: 'InMemory' });
    publisher = await createPublisher<Notification>({ type: 'InMemory' });
    pubSubChannelForNotifications = 'notifications';

    repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' }),
      publisher,
      pubSubChannelForNotifications
    });
  });

  test('returns an AggregatesService if everything is fine.', async (): Promise<void> => {
    const aggregatesService = getAggregatesService({ repository });

    assert.that(aggregatesService.read).is.ofType('function');
  });

  suite('AggregatesService', (): void => {
    test('returns the current state of a requested aggregate.', async (): Promise<void> => {
      const id = v4();
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
          revision: 1
        }
      });

      await domainEventStore.storeDomainEvents({ domainEvents: [ sampleDomainEvent ]});

      const aggregatesService = getAggregatesService({ repository });
      const sampleAggregateState = await aggregatesService.read({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id }
      });

      assert.that(sampleAggregateState).is.equalTo({
        domainEventNames: [ 'succeeded' ]
      });
    });

    test('throws an error if a requested aggregate does not exist.', async (): Promise<void> => {
      const aggregatesService = getAggregatesService({ repository });
      const id = v4();

      await assert.that(async (): Promise<void> => {
        await aggregatesService.read({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id }
        });
      }).is.throwingAsync(`Aggregate 'sampleContext.sampleAggregate.${id}' not found.`);
    });
  });
});
