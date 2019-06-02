'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { AggregateWriteable, CommandInternal, EventInternal } = require('../../../../common/elements'),
      { Application } = require('../../../../common/application'),
      { InMemory } = require('../../../../stores/eventstore'),
      validUpdateInitialState = require('../../../shared/applications/valid/updateInitialState');

suite('AggregateWriteable', () => {
  let aggregateId,
      application,
      command;

  setup(async () => {
    const directory = await validUpdateInitialState();

    application = await Application.load({ directory });

    aggregateId = uuid();

    command = CommandInternal.create({
      context: { name: 'sampleContext' },
      aggregate: { name: 'sampleAggregate', id: aggregateId },
      name: 'execute',
      data: {
        strategy: 'succeed'
      },
      annotations: {
        client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
    });
  });

  test('is a function.', async () => {
    assert.that(AggregateWriteable).is.ofType('function');
  });

  test('throws an error if application is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateWriteable({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        command
      });
      /* eslint-enable no-new */
    }).is.throwing('Application is missing.');
  });

  test('throws an error if context is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateWriteable({
        application,
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        command
      });
      /* eslint-enable no-new */
    }).is.throwing('Context is missing.');
  });

  test('throws an error if context name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateWriteable({
        application,
        context: {},
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        command
      });
      /* eslint-enable no-new */
    }).is.throwing('Context name is missing.');
  });

  test('throws an error if aggregate is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        command
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate is missing.');
  });

  test('throws an error if aggregate name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { id: aggregateId },
        command
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate name is missing.');
  });

  test('throws an error if aggregate id is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate' },
        command
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate id is missing.');
  });

  test('throws an error if command is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId }
      });
      /* eslint-enable no-new */
    }).is.throwing('Command is missing.');
  });

  test('derives from Readable.', async () => {
    const aggregate = new AggregateWriteable({
      application,
      context: { name: 'sampleContext' },
      aggregate: { name: 'sampleAggregate', id: aggregateId },
      command
    });

    assert.that(aggregate.instance.context.name).is.equalTo('sampleContext');
    assert.that(aggregate.instance.name).is.equalTo('sampleAggregate');
    assert.that(aggregate.instance.id).is.equalTo(aggregateId);
    assert.that(aggregate.instance.revision).is.equalTo(0);
    assert.that(aggregate.instance.uncommittedEvents).is.equalTo([]);

    assert.that(aggregate.api.forReadOnly.id).is.equalTo(aggregateId);
    assert.that(aggregate.api.forReadOnly.state).is.equalTo(application.initialState.internal.sampleContext.sampleAggregate);
    assert.that(aggregate.api.forEvents.id).is.sameAs(aggregate.api.forReadOnly.id);
    assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
    assert.that(aggregate.api.forEvents.setState).is.ofType('function');

    assert.that(aggregate.applySnapshot).is.ofType('function');
  });

  suite('api', () => {
    suite('forCommands', () => {
      test('contains the aggregate id.', async () => {
        const aggregate = new AggregateWriteable({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          command
        });

        assert.that(aggregate.api.forCommands.id).is.equalTo(aggregateId);
      });

      suite('state', () => {
        test('references the read-only api state.', async () => {
          const aggregate = new AggregateWriteable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            command
          });

          assert.that(aggregate.api.forCommands.state).is.sameAs(aggregate.api.forReadOnly.state);
        });
      });

      suite('exists', () => {
        test('references the instance exists function.', async () => {
          const aggregate = new AggregateWriteable({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            command
          });

          assert.that(aggregate.api.forCommands.exists).is.sameAs(aggregate.instance.exists);
        });
      });

      suite('events', () => {
        suite('publish', () => {
          test('is a function.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            assert.that(aggregate.api.forCommands.events.publish).is.ofType('function');
          });

          test('throws an error if name is missing.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            assert.that(() => {
              aggregate.api.forCommands.events.publish();
            }).is.throwing('Event name is missing.');
          });

          test('throws an error if a non-existent name is given.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            assert.that(() => {
              aggregate.api.forCommands.events.publish('non-existent');
            }).is.throwing('Unknown event.');
          });

          test('does not throw an error if data is missing.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            assert.that(() => {
              aggregate.api.forCommands.events.publish('succeeded');
            }).is.not.throwing();
          });

          test('throws an error if a schema is given and data does not match.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            assert.that(() => {
              aggregate.api.forCommands.events.publish('executed', {});
            }).is.throwing('Missing required property: strategy (at data.strategy).');
          });

          test('creates a new event and adds it to the list of uncommitted events.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            aggregate.api.forCommands.events.publish('succeeded', {});
            aggregate.api.forCommands.events.publish('executed', { strategy: 'succeed' });

            assert.that(aggregate.instance.uncommittedEvents.length).is.equalTo(2);

            assert.that(aggregate.instance.uncommittedEvents[0].context.name).is.equalTo('sampleContext');
            assert.that(aggregate.instance.uncommittedEvents[0].aggregate.name).is.equalTo('sampleAggregate');
            assert.that(aggregate.instance.uncommittedEvents[0].aggregate.id).is.equalTo(aggregateId);
            assert.that(aggregate.instance.uncommittedEvents[0].name).is.equalTo('succeeded');
            assert.that(aggregate.instance.uncommittedEvents[0].data).is.equalTo({});
            assert.that(aggregate.instance.uncommittedEvents[0].metadata.initiator.user.id).is.equalTo(command.annotations.initiator.user.id);
            assert.that(aggregate.instance.uncommittedEvents[0].metadata.revision.aggregate).is.equalTo(1);

            assert.that(aggregate.instance.uncommittedEvents[1].context.name).is.equalTo('sampleContext');
            assert.that(aggregate.instance.uncommittedEvents[1].aggregate.name).is.equalTo('sampleAggregate');
            assert.that(aggregate.instance.uncommittedEvents[1].aggregate.id).is.equalTo(aggregateId);
            assert.that(aggregate.instance.uncommittedEvents[1].name).is.equalTo('executed');
            assert.that(aggregate.instance.uncommittedEvents[1].data).is.equalTo({ strategy: 'succeed' });
            assert.that(aggregate.instance.uncommittedEvents[1].metadata.initiator.user.id).is.equalTo(command.annotations.initiator.user.id);
            assert.that(aggregate.instance.uncommittedEvents[1].metadata.revision.aggregate).is.equalTo(2);
          });

          test('sets the correlation and the causation id of the new event.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            aggregate.api.forCommands.events.publish('succeeded', {});
            aggregate.api.forCommands.events.publish('executed', { strategy: 'succeed' });

            assert.that(aggregate.instance.uncommittedEvents.length).is.equalTo(2);
            assert.that(aggregate.instance.uncommittedEvents[0].metadata.correlationId).is.equalTo(command.metadata.correlationId);
            assert.that(aggregate.instance.uncommittedEvents[0].metadata.causationId).is.equalTo(command.id);
            assert.that(aggregate.instance.uncommittedEvents[1].metadata.correlationId).is.equalTo(command.metadata.correlationId);
            assert.that(aggregate.instance.uncommittedEvents[1].metadata.causationId).is.equalTo(command.id);
          });

          test('does not increase the aggregate revision.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            aggregate.api.forCommands.events.publish('executed', {
              strategy: 'succeed'
            });

            assert.that(aggregate.instance.revision).is.equalTo(0);
          });

          test('updates the aggregate state.', async () => {
            const aggregate = new AggregateWriteable({
              application,
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId },
              command
            });

            aggregate.api.forCommands.events.publish('executed', {
              strategy: 'succeed'
            });

            assert.that(aggregate.api.forCommands.state.events).is.equalTo([ 'executed' ]);
          });
        });
      });
    });
  });

  suite('applySnapshot', () => {
    test('is a function.', async () => {
      const aggregate = new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        command
      });

      assert.that(aggregate.applySnapshot).is.ofType('function');
    });

    test('throws an error if snapshot is missing.', async () => {
      const aggregate = new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        command
      });

      assert.that(() => {
        aggregate.applySnapshot({});
      }).is.throwing('Snapshot is missing.');
    });

    test('overwrites the revision.', async () => {
      const aggregate = new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        command
      });

      const snapshot = {
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
        revision: 23
      };

      aggregate.applySnapshot({ snapshot });

      assert.that(aggregate.instance.revision).is.equalTo(23);
    });

    test('overwrites the state.', async () => {
      const aggregate = new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        command
      });

      const snapshot = {
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
        revision: 23
      };

      aggregate.applySnapshot({ snapshot });

      assert.that(aggregate.api.forReadOnly.state).is.equalTo(snapshot.state);
      assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
      assert.that(aggregate.api.forCommands.state).is.sameAs(aggregate.api.forReadOnly.state);
    });
  });

  suite('applyEventStream', () => {
    let aggregate,
        eventstore,
        eventStream;

    setup(async () => {
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

      aggregate = new AggregateWriteable({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        command
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
      const otherAggregateId = uuid();
      const event = EventInternal.create({
        context: { name: 'nonExistent' },
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
      }).is.throwingAsync('Context name does not match.');
    });

    test('throws an error if the aggregate name does not match.', async () => {
      const otherAggregateId = uuid();
      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'nonExistent', id: otherAggregateId },
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
      assert.that(aggregate.api.forCommands.state).is.sameAs(aggregate.api.forEvents.state);
      assert.that(aggregate.instance.revision).is.equalTo(2);
    });
  });
});
