import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { CurrentAggregateState } from '../../../../lib/common/domain/CurrentAggregateState';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory';
import { Repository } from '../../../../lib/common/domain/Repository';
import { toArray } from 'streamtoarray';
import { uuid } from 'uuidv4';

suite('Repository', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let aggregateId: string,
      applicationDefinition: ApplicationDefinition,
      domainEventStore: DomainEventStore,
      repository: Repository;

  setup(async (): Promise<void> => {
    applicationDefinition = await getApplicationDefinition({ applicationDirectory });

    aggregateId = uuid();
    domainEventStore = await InMemoryDomainEventStore.create();
    repository = new Repository({
      applicationDefinition,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' })
    });
  });

  teardown(async (): Promise<void> => {
    await domainEventStore.destroy();
  });

  suite('loadCurrentAggregateState', (): void => {
    test('returns the current state of the requested aggregate.', async (): Promise<void> => {
      const domainEventSucceeded = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'succeeded',
        data: {},
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: { aggregate: 1 }
        }
      });

      const domainEventExecuted = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: { aggregate: 2 }
        }
      });

      await domainEventStore.storeDomainEvents({
        domainEvents: [ domainEventSucceeded, domainEventExecuted ]
      });

      const currentAggregateState = await repository.loadCurrentAggregateState({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId }
      });

      assert.that(currentAggregateState.state).is.equalTo({
        domainEventNames: [ 'succeeded', 'executed' ]
      });
      assert.that(currentAggregateState.revision).is.equalTo(2);
    });

    test('stores a snapshot if the snapshot strategy evaluates to true.', async (): Promise<void> => {
      repository = new Repository({
        applicationDefinition,
        domainEventStore,
        snapshotStrategy: getSnapshotStrategy({ name: 'always' })
      });

      const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };

      const domainEvents = [
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            revision: { aggregate: 1 }
          }
        }),
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            revision: { aggregate: 2 }
          }
        }),
        buildDomainEvent({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            revision: { aggregate: 3 }
          }
        })
      ];

      await domainEventStore.storeDomainEvents({ domainEvents });

      await repository.loadCurrentAggregateState({
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
        applicationDefinition,
        domainEventStore,
        snapshotStrategy
      });

      const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };

      await repository.loadCurrentAggregateState({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier
      });

      assert.that(snapshotStrategyCalled).is.false();
    });
  });

  suite('saveCurrentAggregateState', (): void => {
    test('does nothing if there are no unsaved domain events.', async (): Promise<void> => {
      const currentAggregateState = new CurrentAggregateState({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        initialState: applicationDefinition.domain.sampleContext.sampleAggregate.getInitialState()
      });

      await repository.saveCurrentAggregateState({ currentAggregateState });

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId
      });

      const domainEvents = await toArray(domainEventStream);

      assert.that(domainEvents.length).is.equalTo(0);
    });

    test('saves a single unsaved domain event to the domain event store.', async (): Promise<void> => {
      const currentAggregateState = new CurrentAggregateState({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        initialState: applicationDefinition.domain.sampleContext.sampleAggregate.getInitialState()
      });

      currentAggregateState.unsavedDomainEvents.push(
        new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: currentAggregateState.contextIdentifier,
            aggregateIdentifier: currentAggregateState.aggregateIdentifier,
            name: 'executed',
            data: {
              strategy: 'succeed'
            },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1 }
            }
          }),
          state: {
            previous: {
              domainEventNames: []
            },
            next: {
              domainEventNames: [ 'executed' ]
            }
          }
        })
      );

      await repository.saveCurrentAggregateState({ currentAggregateState });

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId
      });

      const domainEvents: DomainEvent<DomainEventData>[] = await toArray(domainEventStream);

      assert.that(domainEvents.length).is.equalTo(1);
      assert.that(domainEvents[0].name).is.equalTo('executed');
      assert.that(domainEvents[0].data).is.equalTo({
        strategy: 'succeed'
      });
    });

    test('saves multiple unsaved domain events to the domain event store.', async (): Promise<void> => {
      const currentAggregateState = new CurrentAggregateState({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        initialState: applicationDefinition.domain.sampleContext.sampleAggregate.getInitialState()
      });

      currentAggregateState.unsavedDomainEvents.push(
        new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: currentAggregateState.contextIdentifier,
            aggregateIdentifier: currentAggregateState.aggregateIdentifier,
            name: 'succeeded',
            data: {},
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1 }
            }
          }),
          state: {
            previous: {
              domainEventNames: []
            },
            next: {
              domainEventNames: [ 'succeeded' ]
            }
          }
        })
      );
      currentAggregateState.unsavedDomainEvents.push(
        new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: currentAggregateState.contextIdentifier,
            aggregateIdentifier: currentAggregateState.aggregateIdentifier,
            name: 'executed',
            data: {
              strategy: 'succeed'
            },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 2 }
            }
          }),
          state: {
            previous: {
              domainEventNames: [ 'succeeded' ]
            },
            next: {
              domainEventNames: [ 'succeeded', 'executed' ]
            }
          }
        })
      );

      await repository.saveCurrentAggregateState({ currentAggregateState });

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId
      });

      const domainEvents: DomainEvent<DomainEventData>[] = await toArray(domainEventStream);

      assert.that(domainEvents.length).is.equalTo(2);
      assert.that(domainEvents[0].name).is.equalTo('succeeded');
      assert.that(domainEvents[0].data).is.equalTo({});
      assert.that(domainEvents[1].name).is.equalTo('executed');
      assert.that(domainEvents[1].data).is.equalTo({
        strategy: 'succeed'
      });
    });

    test('returns an empty list if there are no unsaved domain events.', async (): Promise<void> => {
      const currentAggregateState = new CurrentAggregateState({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        initialState: applicationDefinition.domain.sampleContext.sampleAggregate.getInitialState()
      });

      const savedDomainEvents =
        await repository.saveCurrentAggregateState({ currentAggregateState });

      assert.that(savedDomainEvents.length).is.equalTo(0);
    });

    test('returns the saved domain events.', async (): Promise<void> => {
      const currentAggregateState = new CurrentAggregateState({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        initialState: applicationDefinition.domain.sampleContext.sampleAggregate.getInitialState()
      });

      currentAggregateState.unsavedDomainEvents.push(
        new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: currentAggregateState.contextIdentifier,
            aggregateIdentifier: currentAggregateState.aggregateIdentifier,
            name: 'succeeded',
            data: {},
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1 }
            }
          }),
          state: {
            previous: {
              domainEventNames: []
            },
            next: {
              domainEventNames: [ 'succeeded' ]
            }
          }
        })
      );
      currentAggregateState.unsavedDomainEvents.push(
        new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: currentAggregateState.contextIdentifier,
            aggregateIdentifier: currentAggregateState.aggregateIdentifier,
            name: 'executed',
            data: {
              strategy: 'succeed'
            },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 2 }
            }
          }),
          state: {
            previous: {
              domainEventNames: [ 'succeeded' ]
            },
            next: {
              domainEventNames: [ 'succeeded', 'executed' ]
            }
          }
        })
      );

      const savedDomainEvents =
        await repository.saveCurrentAggregateState({ currentAggregateState });

      assert.that(savedDomainEvents.length).is.equalTo(2);
      assert.that(savedDomainEvents[0].metadata.revision.global).is.equalTo(1);
      assert.that(savedDomainEvents[1].metadata.revision.global).is.equalTo(2);
    });
  });
});
