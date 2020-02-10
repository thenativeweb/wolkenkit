import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { CurrentAggregateState } from '../../../../lib/common/domain/CurrentAggregateState';
import { CustomError } from 'defekt';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { State } from '../../../../lib/common/elements/State';
import { uuid } from 'uuidv4';

suite('CurrentAggregateState', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let aggregateId: string,
      applicationDefinition: ApplicationDefinition,
      currentAggregateState: CurrentAggregateState<State>;

  setup(async (): Promise<void> => {
    aggregateId = uuid();

    applicationDefinition = await getApplicationDefinition({ applicationDirectory });

    currentAggregateState = new CurrentAggregateState({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
      initialState: applicationDefinition.domain.sampleContext.sampleAggregate.getInitialState()
    });
  });

  suite('contextIdentifier', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(currentAggregateState.contextIdentifier).is.equalTo({
        name: 'sampleContext'
      });
    });
  });

  suite('aggregateIdentifier', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(currentAggregateState.aggregateIdentifier).is.equalTo({
        name: 'sampleAggregate',
        id: aggregateId
      });
    });
  });

  suite('state', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(currentAggregateState.state).is.equalTo({
        domainEventNames: []
      });
    });
  });

  suite('revision', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(currentAggregateState.revision).is.equalTo(0);
    });
  });

  suite('unsavedDomainEvents', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(currentAggregateState.unsavedDomainEvents).is.equalTo([]);
    });
  });

  suite('applySnapshot', (): void => {
    test(`throws an error if the id of the snapshot's aggregate identifier does not match.`, async (): Promise<void> => {
      const snapshotAggregateIdentifierId = uuid();

      assert.that((): void => {
        currentAggregateState.applySnapshot({
          snapshot: {
            aggregateIdentifier: { name: 'sampleAggregate', id: snapshotAggregateIdentifierId },
            revision: 1,
            state: {
              domainEventNames: [ 'executed' ]
            }
          }
        });
      }).is.throwing((ex): boolean => (ex as CustomError).code === 'EIDENTIFIERMISMATCH' && ex.message === 'Failed to apply snapshot. Aggregate id does not match.');
    });

    test('updates the state.', async (): Promise<void> => {
      currentAggregateState.applySnapshot({
        snapshot: {
          aggregateIdentifier: currentAggregateState.aggregateIdentifier,
          revision: 1,
          state: {
            domainEventNames: [ 'executed' ]
          }
        }
      });

      assert.that(currentAggregateState.state).is.equalTo({
        domainEventNames: [ 'executed' ]
      });
    });

    test('updates the revision.', async (): Promise<void> => {
      currentAggregateState.applySnapshot({
        snapshot: {
          aggregateIdentifier: currentAggregateState.aggregateIdentifier,
          revision: 1,
          state: {
            domainEventNames: [ 'executed' ]
          }
        }
      });

      assert.that(currentAggregateState.revision).is.equalTo(1);
    });
  });

  suite('exists', (): void => {
    test('returns false when the revision is 0.', async (): Promise<void> => {
      assert.that(currentAggregateState.exists()).is.false();
    });

    test('returns true when the revision is greater than 0.', async (): Promise<void> => {
      currentAggregateState.applySnapshot({
        snapshot: {
          aggregateIdentifier: currentAggregateState.aggregateIdentifier,
          revision: 1,
          state: {
            domainEventNames: [ 'executed' ]
          }
        }
      });

      assert.that(currentAggregateState.exists()).is.true();
    });
  });

  suite('applyDomainEvent', (): void => {
    test('throws an error if the context name does not match.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'nonExistent' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: { aggregate: 1 }
        }
      });

      assert.that((): void => {
        currentAggregateState.applyDomainEvent({ applicationDefinition, domainEvent });
      }).is.throwing('Context name does not match.');
    });

    test('throws an error if the aggregate name does not match.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'nonExistent', id: aggregateId },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: { aggregate: 1 }
        }
      });

      assert.that((): void => {
        currentAggregateState.applyDomainEvent({ applicationDefinition, domainEvent });
      }).is.throwing('Aggregate name does not match.');
    });

    test('throws an error if the aggregate id does not match.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: { aggregate: 1 }
        }
      });

      assert.that((): void => {
        currentAggregateState.applyDomainEvent({ applicationDefinition, domainEvent });
      }).is.throwing('Aggregate id does not match.');
    });

    test('throws an error if the event is not known.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'nonExistent',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: { aggregate: 1 }
        }
      });

      assert.that((): void => {
        currentAggregateState.applyDomainEvent({ applicationDefinition, domainEvent });
      }).is.throwing(`Failed to apply unknown domain event 'nonExistent' in 'sampleContext.sampleAggregate'.`);
    });

    test('returns the next state.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: { aggregate: 1 }
        }
      });

      const nextState = currentAggregateState.applyDomainEvent({ applicationDefinition, domainEvent });

      assert.that(nextState).is.equalTo({
        domainEventNames: [ 'executed' ]
      });
    });
  });
});
