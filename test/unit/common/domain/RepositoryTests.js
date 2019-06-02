'use strict';

const assert = require('assertthat'),
      cloneDeep = require('lodash/cloneDeep'),
      toArray = require('streamtoarray'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { AggregateReadable, AggregateWriteable, CommandInternal, EventInternal } = require('../../../../common/elements'),
      { InMemory } = require('../../../../stores/eventstore'),
      { Repository } = require('../../../../common/domain'),
      updateInitialState = require('../../../shared/applications/valid/updateInitialState');

suite('Repository', () => {
  let application,
      eventstore;

  setup(async () => {
    const directory = await updateInitialState();

    application = await Application.load({ directory });

    eventstore = new InMemory();
    await eventstore.initialize();
  });

  teardown(async () => {
    await eventstore.destroy();
  });

  test('is a function.', async () => {
    assert.that(Repository).is.ofType('function');
  });

  test('throws an error if application is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Repository({ eventstore });
      /* eslint-enable no-new */
    }).is.throwing('Application is missing.');
  });

  test('throws an error if event store is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Repository({ application });
      /* eslint-enable no-new */
    }).is.throwing('Event store is missing.');
  });

  suite('instance', () => {
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

    suite('saveAggregate', () => {
      test('is a function.', async () => {
        assert.that(repository.saveAggregate).is.ofType('function');
      });

      test('throws an error if aggregate is missing.', async () => {
        await assert.that(async () => {
          await repository.saveAggregate({});
        }).is.throwingAsync('Aggregate is missing.');
      });

      test('does nothing when there are no uncommitted events.', async () => {
        await repository.saveAggregate({ aggregate });

        const eventStream = await eventstore.getEventStream({ aggregateId: aggregate.instance.id });
        const events = await toArray(eventStream);

        assert.that(events.length).is.equalTo(0);
      });

      test('saves a single uncommitted event to the event store.', async () => {
        aggregate.api.forCommands.events.publish('executed', { strategy: 'succeed' });

        await repository.saveAggregate({ aggregate });

        const eventStream = await eventstore.getEventStream({ aggregateId: aggregate.instance.id });
        const events = await toArray(eventStream);

        assert.that(events.length).is.equalTo(1);
        assert.that(events[0].name).is.equalTo('executed');
        assert.that(events[0].data).is.equalTo({ strategy: 'succeed' });
      });

      test('saves multiple uncommitted events to the event store.', async () => {
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

      test('returns the committed events from the event store.', async () => {
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

      test('returns an empty list of committed events when there were no uncommited events.', async () => {
        const committedEvents = await repository.saveAggregate({ aggregate });

        assert.that(committedEvents).is.equalTo([]);
      });
    });

    suite('replayAggregate', () => {
      test('is a function.', async () => {
        assert.that(repository.replayAggregate).is.ofType('function');
      });

      test('throws an error if aggregate is missing.', async () => {
        await assert.that(async () => {
          await repository.replayAggregate({});
        }).is.throwingAsync('Aggregate is missing.');
      });

      test('returns the aggregate as-is if no events have been saved.', async () => {
        const oldState = cloneDeep(aggregate.api.forReadOnly.state);

        const aggregateReplayed = await repository.replayAggregate({ aggregate });

        assert.that(aggregateReplayed.api.forReadOnly.state).is.equalTo(oldState);
      });

      test('throws an error if the aggregate type does not match the events.', async () => {
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

        await assert.that(async () => {
          await repository.replayAggregate({ aggregate });
        }).is.throwingAsync('Unknown event.');
      });

      test('applies previously saved events.', async () => {
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

      test('applies previously saved snapshots and events.', async () => {
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

    suite('loadAggregate', () => {
      test('is a function.', async () => {
        assert.that(repository.loadAggregate).is.ofType('function');
      });

      test('throws an error if context name is missing.', async () => {
        await assert.that(async () => {
          await repository.loadAggregate({
            aggregateName: 'sampleAggregate',
            aggregateId: uuid()
          });
        }).is.throwingAsync('Context name is missing.');
      });

      test('throws an error if aggregate name is missing.', async () => {
        await assert.that(async () => {
          await repository.loadAggregate({
            contextName: 'sampleContext',
            aggregateId: uuid()
          });
        }).is.throwingAsync('Aggregate name is missing.');
      });

      test('throws an error if aggregate id is missing.', async () => {
        await assert.that(async () => {
          await repository.loadAggregate({
            contextName: 'sampleContext',
            aggregateName: 'sampleAggregate'
          });
        }).is.throwingAsync('Aggregate id is missing.');
      });

      test('returns a replayed aggregate.', async () => {
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

    suite('loadAggregateForCommand', () => {
      test('is a function.', async () => {
        assert.that(repository.loadAggregateForCommand).is.ofType('function');
      });

      test('throws an error if command is missing.', async () => {
        await assert.that(async () => {
          await repository.loadAggregateForCommand({});
        }).is.throwingAsync('Command is missing.');
      });

      test('returns a replayed aggregate.', async () => {
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
