import Aggregate from '../../../../src/common/elements/Aggregate';
import Application from '../../../../src/common/application/Application';
import assert from 'assertthat';
import cloneDeep from 'lodash/cloneDeep';
import CommandInternal from '../../../../src/common/elements/CommandInternal';
import EventInternal from '../../../../src/common/elements/EventInternal';
import InMemoryEventstore from '../../../../src/stores/eventstore/InMemory';
import Repository from '../../../../src/common/domain/Repository';
import toArray from 'streamtoarray';
import updateInitialState from '../../../shared/applications/valid/updateInitialState';
import uuid from 'uuidv4';

suite('Repository', (): void => {
  let application,
      eventstore;

  setup(async (): Promise<void> => {
    const directory = await updateInitialState();

    application = await Application.load({ directory });

    eventstore = new InMemoryEventstore();
    await eventstore.initialize();
  });

  teardown(async (): Promise<void> => {
    await eventstore.destroy();
  });

  test('is a function.', async (): Promise<void> => {
    assert.that(Repository).is.ofType('function');
  });

  test('throws an error if application is missing.', async (): Promise<void> => {
    assert.that((): void => {
      /* eslint-disable no-new */
      new Repository({ eventstore });
      /* eslint-enable no-new */
    }).is.throwing('Application is missing.');
  });

  test('throws an error if event store is missing.', async (): Promise<void> => {
    assert.that((): void => {
      /* eslint-disable no-new */
      new Repository({ application });
      /* eslint-enable no-new */
    }).is.throwing('Event store is missing.');
  });

  suite('instance', (): void => {
    let aggregate,
        command,
        repository;

    setup(() => {
      repository = new Repository({ application, eventstore });

      command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      aggregate = new AggregateWriteable({
        application,
        context: { name: command.context.name },
        aggregate: { name: command.aggregate.name, id: command.aggregate.id },
        command
      });
    });

    suite('saveAggregate', (): void => {
      test('is a function.', async (): Promise<void> => {
        assert.that(repository.saveAggregate).is.ofType('function');
      });

      test('throws an error if aggregate is missing.', async (): Promise<void> => {
        await assert.that(async (): Promise<void> => {
          await repository.saveAggregate({});
        }).is.throwingAsync('Aggregate is missing.');
      });

      test('does nothing when there are no uncommitted events.', async (): Promise<void> => {
        await repository.saveAggregate({ aggregate });

        const eventStream = await eventstore.getEventStream({ aggregateId: aggregate.instance.id });
        const events = await toArray(eventStream);

        assert.that(events.length).is.equalTo(0);
      });

      test('saves a single uncommitted event to the event store.', async (): Promise<void> => {
        aggregate.api.forCommands.events.publish('executed', { strategy: 'succeed' });

        await repository.saveAggregate({ aggregate });

        const eventStream = await eventstore.getEventStream({ aggregateId: aggregate.instance.id });
        const events = await toArray(eventStream);

        assert.that(events.length).is.equalTo(1);
        assert.that(events[0].name).is.equalTo('executed');
        assert.that(events[0].data).is.equalTo({ strategy: 'succeed' });
      });

      test('saves multiple uncommitted events to the event store.', async (): Promise<void> => {
        aggregate.api.forCommands.events.publish('succeeded');
        aggregate.api.forCommands.events.publish('executed', { strategy: 'succeed' });

        await repository.saveAggregate({ aggregate });

        const eventStream = await eventstore.getEventStream({ aggregateId: aggregate.instance.id });
        const events = await toArray(eventStream);

        assert.that(events.length).is.equalTo(2);
        assert.that(events[0].name).is.equalTo('succeeded');
        assert.that(events[0].data).is.equalTo({});
        assert.that(events[1].name).is.equalTo('executed');
        assert.that(events[1].data).is.equalTo({ strategy: 'succeed' });
      });

      test('returns the committed events from the event store.', async (): Promise<void> => {
        aggregate.api.forCommands.events.publish('succeeded');
        aggregate.api.forCommands.events.publish('executed', { strategy: 'succeed' });

        const committedEvents = await repository.saveAggregate({ aggregate });

        assert.that(committedEvents.length).is.equalTo(2);
        assert.that(committedEvents[0].metadata.revision.global).is.ofType('number');
        assert.that(committedEvents[1].metadata.revision.global).is.ofType('number');
        assert.that(committedEvents[0].metadata.revision.global + 1).is.equalTo(
          committedEvents[1].metadata.revision.global
        );
      });

      test('returns an empty list of committed events when there were no uncommited events.', async (): Promise<void> => {
        const committedEvents = await repository.saveAggregate({ aggregate });

        assert.that(committedEvents).is.equalTo([]);
      });
    });

    suite('replayAggregate', (): void => {
      test('is a function.', async (): Promise<void> => {
        assert.that(repository.replayAggregate).is.ofType('function');
      });

      test('throws an error if aggregate is missing.', async (): Promise<void> => {
        await assert.that(async (): Promise<void> => {
          await repository.replayAggregate({});
        }).is.throwingAsync('Aggregate is missing.');
      });

      test('returns the aggregate as-is if no events have been saved.', async (): Promise<void> => {
        const oldState = cloneDeep(aggregate.api.forReadOnly.state);

        const aggregateReplayed = await repository.replayAggregate({ aggregate });

        assert.that(aggregateReplayed.api.forReadOnly.state).is.equalTo(oldState);
      });

      test('throws an error if the aggregate type does not match the events.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'succeeded',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 1 }
          },
          annotations: { state: {}, previousState: {}}
        });
        const nonExistent = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'nonExistent',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 2 }
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ succeeded, nonExistent ]
        });

        await assert.that(async (): Promise<void> => {
          await repository.replayAggregate({ aggregate });
        }).is.throwingAsync('Unknown event.');
      });

      test('applies previously saved events.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'succeeded',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 1 }
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 2 }
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ succeeded, executed ]
        });

        const aggregateReplayed = await repository.replayAggregate({ aggregate });

        assert.that(aggregateReplayed.api.forReadOnly.state).is.equalTo({
          events: [ 'succeeded', 'executed' ]
        });
      });

      test('applies previously saved snapshots and events.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'succeeded',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 100 }
          },
          annotations: { state: { events: [ 'succeeded', 'succeeded', 'succeeded' ]}, previousState: {}}
        });
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 101 }
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ succeeded, executed ]
        });

        const aggregateReplayed = await repository.replayAggregate({ aggregate });

        assert.that(aggregateReplayed.api.forReadOnly.state).is.equalTo({
          events: [ 'succeeded', 'succeeded', 'succeeded', 'executed' ]
        });
      });
    });

    suite('loadAggregate', (): void => {
      test('is a function.', async (): Promise<void> => {
        assert.that(repository.loadAggregate).is.ofType('function');
      });

      test('throws an error if context name is missing.', async (): Promise<void> => {
        await assert.that(async (): Promise<void> => {
          await repository.loadAggregate({
            aggregateName: 'sampleAggregate',
            aggregateId: uuid()
          });
        }).is.throwingAsync('Context name is missing.');
      });

      test('throws an error if aggregate name is missing.', async (): Promise<void> => {
        await assert.that(async (): Promise<void> => {
          await repository.loadAggregate({
            contextName: 'sampleContext',
            aggregateId: uuid()
          });
        }).is.throwingAsync('Aggregate name is missing.');
      });

      test('throws an error if aggregate id is missing.', async (): Promise<void> => {
        await assert.that(async (): Promise<void> => {
          await repository.loadAggregate({
            contextName: 'sampleContext',
            aggregateName: 'sampleAggregate'
          });
        }).is.throwingAsync('Aggregate id is missing.');
      });

      test('returns a replayed aggregate.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'succeeded',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 1 }
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 2 }
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ succeeded, executed ]
        });

        const loadedAggregate = await repository.loadAggregate({
          contextName: 'sampleContext',
          aggregateName: 'sampleAggregate',
          aggregateId: aggregate.instance.id
        });

        assert.that(loadedAggregate).is.instanceOf(AggregateReadable);
        assert.that(loadedAggregate.api.forReadOnly.state).is.equalTo({
          events: [ 'succeeded', 'executed' ]
        });
      });
    });

    suite('loadAggregateForCommand', (): void => {
      test('is a function.', async (): Promise<void> => {
        assert.that(repository.loadAggregateForCommand).is.ofType('function');
      });

      test('throws an error if command is missing.', async (): Promise<void> => {
        await assert.that(async (): Promise<void> => {
          await repository.loadAggregateForCommand({});
        }).is.throwingAsync('Command is missing.');
      });

      test('returns a replayed aggregate.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'succeeded',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 1 }
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 2 }
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ succeeded, executed ]
        });

        const loadedAggregate = await repository.loadAggregateForCommand({
          contextName: 'sampleContext',
          aggregateName: 'sampleAggregate',
          aggregateId: aggregate.instance.id,
          command
        });

        assert.that(loadedAggregate).is.instanceOf(AggregateWriteable);
        assert.that(loadedAggregate.api.forCommands.state).is.equalTo({
          events: [ 'succeeded', 'executed' ]
        });
      });
    });
  });
});
