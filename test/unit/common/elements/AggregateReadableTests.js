'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      uuid = require('uuidv4');

const { AggregateReadable, EventInternal } = require('../../../../common/elements'),
      { Application } = require('../../../../common/application'),
      { InMemory } = require('../../../../stores/eventstore'),
      validUpdateInitialState = require('../../../shared/applications/valid/updateInitialState');

suite('AggregateReadable', () => {
  let application;

  setup(async () => {
    const directory = await validUpdateInitialState();

    application = await Application.load({ directory });
  });

  test('is a function.', async () => {
    assert.that(AggregateReadable).is.ofType('function');
  });

  getOptionTests({
    options: {
      // We can not use the actual application here, because it gets created
      // in the setup function which is run after getOptionTests.
      application: {},
      context: { name: 'sampleContext' },
      aggregate: { name: 'sampleAggregate', id: uuid() }
    },
    run (options) {
      /* eslint-disable no-new */
      new AggregateReadable(options);
      /* eslint-enable no-new */
    }
  });

  test('throws an error if context does not exist.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateReadable({
        application,
        context: { name: 'non-existent' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Context does not exist.');
  });

  test('throws an error if aggregate does not exist.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateReadable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'non-existent', id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate does not exist.');
  });

  suite('instance', () => {
    suite('context', () => {
      test('contains the requested aggregate\'s context name.', async () => {
        const contextName = 'sampleContext';

        const aggregate = new AggregateReadable({
          application,
          context: { name: contextName },
          aggregate: { name: 'sampleAggregate', id: uuid() }
        });

        assert.that(aggregate.instance.context.name).is.equalTo(contextName);
      });
    });

    suite('name', () => {
      test('contains the requested aggregate\'s name.', async () => {
        const aggregateName = 'sampleAggregate';

        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: aggregateName, id: uuid() }
        });

        assert.that(aggregate.instance.name).is.equalTo(aggregateName);
      });
    });

    suite('id', () => {
      test('contains the requested aggregate\'s id.', async () => {
        const aggregateId = uuid();

        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        });

        assert.that(aggregate.instance.id).is.equalTo(aggregateId);
      });
    });

    suite('revision', () => {
      test('is 0.', async () => {
        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() }
        });

        assert.that(aggregate.instance.revision).is.equalTo(0);
      });
    });

    suite('uncommitted events', () => {
      test('is an empty array.', async () => {
        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() }
        });

        assert.that(aggregate.instance.uncommittedEvents).is.equalTo([]);
      });
    });

    suite('exists', () => {
      test('is a function.', async () => {
        const aggregateId = uuid();

        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        });

        assert.that(aggregate.instance.exists).is.ofType('function');
      });

      test('returns false if revision is 0.', async () => {
        const aggregateId = uuid();

        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        });

        assert.that(aggregate.instance.exists()).is.false();
      });

      test('returns true if revision is greater than 0.', async () => {
        const aggregateId = uuid();

        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        });

        const snapshot = {
          state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
          revision: 23
        };

        aggregate.applySnapshot({ snapshot });

        assert.that(aggregate.instance.exists()).is.true();
      });
    });
  });

  suite('api', () => {
    suite('forReadOnly', () => {
      test('contains the aggregate id.', async () => {
        const id = uuid();

        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id }
        });

        assert.that(aggregate.api.forReadOnly.id).is.equalTo(id);
      });

      suite('state', () => {
        test('contains the initial state.', async () => {
          const aggregate = new AggregateReadable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          assert.that(aggregate.api.forReadOnly.state).is.equalTo(application.initialState.internal.sampleContext.sampleAggregate);
        });

        test('is a deep copy.', async () => {
          const aggregate = new AggregateReadable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          assert.that(aggregate.api.forReadOnly.state).is.not.sameAs(application.initialState.internal.sampleContext.sampleAggregate);
        });
      });

      suite('exists', () => {
        test('references the instance exists function.', async () => {
          const aggregateId = uuid();

          const aggregate = new AggregateReadable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId }
          });

          assert.that(aggregate.api.forReadOnly.exists).is.sameAs(aggregate.instance.exists);
        });
      });
    });

    suite('forEvents', () => {
      test('contains the aggregate id.', async () => {
        const id = uuid();

        const aggregate = new AggregateReadable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id }
        });

        assert.that(aggregate.api.forEvents.id).is.equalTo(id);
      });

      suite('state', () => {
        test('references the read-only api state.', async () => {
          const aggregate = new AggregateReadable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
        });
      });

      suite('setState', () => {
        test('is a function.', async () => {
          const aggregate = new AggregateReadable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          assert.that(aggregate.api.forEvents.setState).is.ofType('function');
        });

        test('updates the state.', async () => {
          const aggregate = new AggregateReadable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          assert.that(aggregate.api.forEvents.state.events).is.equalTo([]);

          aggregate.api.forEvents.setState({
            events: [ 'succeeded' ]
          });

          assert.that(aggregate.api.forEvents.state.events).is.equalTo([ 'succeeded' ]);
        });

        test('correctly resets arrays.', async () => {
          const aggregate = new AggregateReadable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          aggregate.api.forEvents.setState({
            events: [ 'succeeded' ]
          });

          aggregate.api.forEvents.setState({
            events: []
          });

          assert.that(aggregate.api.forEvents.state.events).is.equalTo([]);
        });
      });
    });
  });

  suite('applySnapshot', () => {
    test('is a function.', async () => {
      const aggregate = new AggregateReadable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });

      assert.that(aggregate.applySnapshot).is.ofType('function');
    });

    test('throws an error if snapshot is missing.', async () => {
      const aggregate = new AggregateReadable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });

      assert.that(() => {
        aggregate.applySnapshot({});
      }).is.throwing('Snapshot is missing.');
    });

    test('overwrites the revision.', async () => {
      const aggregate = new AggregateReadable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });

      const snapshot = {
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
        revision: 23
      };

      aggregate.applySnapshot({ snapshot });

      assert.that(aggregate.instance.revision).is.equalTo(23);
    });

    test('overwrites the state.', async () => {
      const aggregate = new AggregateReadable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });

      const snapshot = {
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
        revision: 23
      };

      aggregate.applySnapshot({ snapshot });

      assert.that(aggregate.api.forReadOnly.state).is.equalTo(snapshot.state);
      assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
    });
  });

  suite('applyEventStream', () => {
    let aggregate,
        eventstore,
        eventStream;

    setup(async () => {
      const aggregateId = uuid();

      eventstore = new InMemory();

      await eventstore.initialize();

      const succeeded = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
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
        aggregate: { name: 'sampleAggregate', id: aggregateId },
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

      aggregate = new AggregateReadable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId }
      });
      eventStream = await eventstore.getEventStream({ aggregateId });
    });

    teardown(async () => {
      await eventstore.destroy();
    });

    test('is a function.', async () => {
      assert.that(aggregate.applyEventStream).is.ofType('function');
    });

    test('throws an error if application is missing.', async () => {
      await assert.that(async () => {
        await aggregate.applyEventStream({
          eventStream
        });
      }).is.throwingAsync('Application is missing.');
    });

    test('throws an error if event stream is missing.', async () => {
      await assert.that(async () => {
        await aggregate.applyEventStream({
          application
        });
      }).is.throwingAsync('Event stream is missing.');
    });

    test('throws an error if the context name does not match.', async () => {
      const aggregateId = uuid();
      const event = EventInternal.create({
        context: { name: 'nonExistent' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ event ]
      });

      eventStream = await eventstore.getEventStream({ aggregateId });

      await assert.that(async () => {
        await aggregate.applyEventStream({
          application,
          eventStream
        });
      }).is.throwingAsync('Context name does not match.');
    });

    test('throws an error if the aggregate name does not match.', async () => {
      const aggregateId = uuid();
      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'nonExistent', id: aggregateId },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ event ]
      });

      eventStream = await eventstore.getEventStream({ aggregateId });

      await assert.that(async () => {
        await aggregate.applyEventStream({
          application,
          eventStream
        });
      }).is.throwingAsync('Aggregate name does not match.');
    });

    test('throws an error if the aggregate id does not match.', async () => {
      const otherAggregateId = uuid();
      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: otherAggregateId },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ event ]
      });

      eventStream = await eventstore.getEventStream({ aggregateId: otherAggregateId });

      await assert.that(async () => {
        await aggregate.applyEventStream({
          application,
          eventStream
        });
      }).is.throwingAsync('Aggregate id does not match.');
    });

    test('throws an error if an unknown event name is given.', async () => {
      // Reset the eventstore to ensure to get only one event.
      await eventstore.destroy();
      await eventstore.initialize();

      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregate.instance.id },
        name: 'nonExistent',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ event ]
      });

      eventStream = await eventstore.getEventStream({ aggregateId: aggregate.instance.id });

      await assert.that(async () => {
        await aggregate.applyEventStream({
          application,
          eventStream
        });
      }).is.throwingAsync('Unknown event.');
    });

    test('applies the event stream.', async () => {
      await aggregate.applyEventStream({
        application,
        eventStream
      });

      assert.that(aggregate.api.forEvents.state).is.equalTo({
        events: [ 'succeeded', 'executed' ]
      });
      assert.that(aggregate.api.forReadOnly.state).is.sameAs(aggregate.api.forEvents.state);
      assert.that(aggregate.instance.revision).is.equalTo(2);
    });
  });
});
