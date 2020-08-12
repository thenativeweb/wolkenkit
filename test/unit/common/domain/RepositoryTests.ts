import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { createLockStore } from '../../../../lib/stores/lockStore/createLockStore';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { Notification } from '../../../../lib/common/elements/Notification';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Repository } from '../../../../lib/common/domain/Repository';
import { v4 } from 'uuid';

suite('Repository', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let aggregateId: string,
      application: Application,
      domainEventStore: DomainEventStore,
      lockStore: LockStore,
      publisher: Publisher<Notification>,
      pubSubChannelForNotifications: string,
      repository: Repository;

  setup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });

    aggregateId = v4();
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

  teardown(async (): Promise<void> => {
    await domainEventStore.destroy();
  });

  suite('getAggregateInstance', (): void => {
    test('returns the current state of the requested aggregate.', async (): Promise<void> => {
      const domainEventSucceeded = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'succeeded',
        data: {},
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: 1
        }
      });

      const domainEventExecuted = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: 2
        }
      });

      await domainEventStore.storeDomainEvents({
        domainEvents: [ domainEventSucceeded, domainEventExecuted ]
      });

      const aggregateInstance = await repository.getAggregateInstance({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId }
      });

      assert.that(aggregateInstance.state).is.equalTo({
        domainEventNames: [ 'succeeded', 'executed' ]
      });
      assert.that(aggregateInstance.revision).is.equalTo(2);
    });

    test('stores a snapshot if the snapshot strategy evaluates to true.', async (): Promise<void> => {
      repository = new Repository({
        application,
        lockStore,
        domainEventStore,
        snapshotStrategy: getSnapshotStrategy({ name: 'always' }),
        publisher,
        pubSubChannelForNotifications
      });

      const aggregateIdentifier = { name: 'sampleAggregate', id: v4() };

      const domainEvents = [
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            revision: 1
          }
        }),
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            revision: 2
          }
        }),
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            revision: 3
          }
        })
      ];

      await domainEventStore.storeDomainEvents({ domainEvents });

      await repository.getAggregateInstance({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier
      });

      const latestSnapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

      assert.that(latestSnapshot).is.not.undefined();
      assert.that(latestSnapshot?.revision).is.equalTo(3);
    });

    test('does not call the snapshot strategy if no domain events have been replayed.', async (): Promise<void> => {
      let snapshotStrategyCalled = false;
      const snapshotStrategy = (): boolean => {
        snapshotStrategyCalled = true;

        return false;
      };

      repository = new Repository({
        application,
        lockStore,
        domainEventStore,
        snapshotStrategy,
        publisher,
        pubSubChannelForNotifications
      });

      const aggregateIdentifier = { name: 'sampleAggregate', id: v4() };

      await repository.getAggregateInstance({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier
      });

      assert.that(snapshotStrategyCalled).is.false();
    });
  });
});
