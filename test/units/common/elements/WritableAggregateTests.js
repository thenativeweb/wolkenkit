'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { Command, WritableAggregate } = require('../../../../common/elements');

suite('WritableAggregate', () => {
  let aggregateId,
      command;

  setup(async () => {
    aggregateId = uuid();

    command = new Command({
      context: { name: 'planning' },
      aggregate: { name: 'peerGroup', id: aggregateId },
      name: 'join',
      data: {
        participant: 'Jane Doe'
      }
    });
  });

  test('is a function.', async () => {
    assert.that(WritableAggregate).is.ofType('function');
  });

  test('throws an error if domain is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new WritableAggregate({});
      /* eslint-enable no-new */
    }).is.throwing('Domain is missing.');
  });

  test('throws an error if context is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new WritableAggregate({ domain });
      /* eslint-enable no-new */
    }).is.throwing('Context is missing.');
  });

  test('throws an error if context name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new WritableAggregate({ domain, context: {}});
      /* eslint-enable no-new */
    }).is.throwing('Context name is missing.');
  });

  test('throws an error if aggregate is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new WritableAggregate({
        domain,
        context: { name: 'planning' }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate is missing.');
  });

  test('throws an error if aggregate name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new WritableAggregate({
        domain,
        context: { name: 'planning' },
        aggregate: {}
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate name is missing.');
  });

  test('throws an error if aggregate id is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new WritableAggregate({
        domain,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup' }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate id is missing.');
  });

  test('throws an error if command is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new WritableAggregate({
        domain,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Command is missing.');
  });

  test('derives from Readable.', async () => {
    const aggregate = new WritableAggregate({
      domain,
      context: { name: 'planning' },
      aggregate: { name: 'peerGroup', id: aggregateId },
      command
    });

    assert.that(aggregate.definition).is.ofType('object');
    assert.that(aggregate.definition.initialState.participants).is.equalTo([]);
    assert.that(aggregate.definition.commands.start).is.ofType('object');
    assert.that(aggregate.definition.commands.start.isAuthorized).is.ofType('function');
    assert.that(aggregate.definition.commands.start.handle).is.ofType('function');
    assert.that(aggregate.definition.commands.join).is.ofType('object');
    assert.that(aggregate.definition.commands.join.isAuthorized).is.ofType('function');
    assert.that(aggregate.definition.commands.join.handle).is.ofType('function');
    assert.that(aggregate.definition.events.started).is.ofType('object');
    assert.that(aggregate.definition.events.started.handle).is.ofType('function');
    assert.that(aggregate.definition.events.started.isAuthorized).is.ofType('function');
    assert.that(aggregate.definition.events.joined).is.ofType('object');
    assert.that(aggregate.definition.events.joined.handle).is.ofType('function');
    assert.that(aggregate.definition.events.joined.isAuthorized).is.ofType('function');

    assert.that(aggregate.instance.id).is.equalTo(aggregateId);
    assert.that(aggregate.instance.revision).is.equalTo(0);
    assert.that(aggregate.instance.uncommittedEvents).is.equalTo([]);

    assert.that(aggregate.api.forReadOnly.id).is.equalTo(aggregateId);
    assert.that(aggregate.api.forReadOnly.state).is.equalTo(domain.planning.peerGroup.initialState);
    assert.that(aggregate.api.forEvents.id).is.sameAs(aggregate.api.forReadOnly.id);
    assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
    assert.that(aggregate.api.forEvents.setState).is.ofType('function');

    assert.that(aggregate.applySnapshot).is.ofType('function');
  });

  suite('api', () => {
    suite('forCommands', () => {
      test('contains the aggregate id.', async () => {
        const aggregate = new WritableAggregate({
          domain,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: aggregateId },
          command
        });

        assert.that(aggregate.api.forCommands.id).is.equalTo(aggregateId);
      });

      suite('state', () => {
        test('references the read-only api state.', async () => {
          const aggregate = new WritableAggregate({
            domain,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: aggregateId },
            command
          });

          assert.that(aggregate.api.forCommands.state).is.sameAs(aggregate.api.forReadOnly.state);
        });
      });

      suite('exists', () => {
        test('references the instance exists function.', async () => {
          const aggregate = new WritableAggregate({
            domain,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: aggregateId },
            command
          });

          assert.that(aggregate.api.forCommands.exists).is.sameAs(aggregate.instance.exists);
        });
      });

      suite('events', () => {
        suite('publish', () => {
          test('is a function.', async () => {
            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            assert.that(aggregate.api.forCommands.events.publish).is.ofType('function');
          });

          test('throws an error if name is missing.', async () => {
            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            assert.that(() => {
              aggregate.api.forCommands.events.publish();
            }).is.throwing('Event name is missing.');
          });

          test('throws an error if a non-existent name is given.', async () => {
            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            assert.that(() => {
              aggregate.api.forCommands.events.publish('non-existent');
            }).is.throwing('Unknown event.');
          });

          test('does not throw an error if data is missing.', async () => {
            command.addInitiator({ token: { sub: '6db3ef6a-a607-40cc-8108-65e81816b320' }});

            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            assert.that(() => {
              aggregate.api.forCommands.events.publish('started');
            }).is.not.throwing();
          });

          test('throws an error if a schema is given and data does not match.', async () => {
            const token = { sub: '6db3ef6a-a607-40cc-8108-65e81816b320' };

            command.addInitiator({ token });

            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            assert.that(() => {
              aggregate.api.forCommands.events.publish('joined', {});
            }).is.throwing('Missing required property: participant (at data.participant).');
          });

          test('creates a new event and adds it to the list of uncommitted events.', async () => {
            const token = { sub: '6db3ef6a-a607-40cc-8108-65e81816b320' };

            command.addInitiator({ token });

            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            aggregate.api.forCommands.events.publish('joined', {
              participant: 'Jane Doe'
            });

            aggregate.api.forCommands.events.publish('joined', {
              participant: 'John Doe'
            });

            assert.that(aggregate.instance.uncommittedEvents.length).is.equalTo(2);
            assert.that(aggregate.instance.uncommittedEvents[0].event.context.name).is.equalTo('planning');
            assert.that(aggregate.instance.uncommittedEvents[0].event.aggregate.name).is.equalTo('peerGroup');
            assert.that(aggregate.instance.uncommittedEvents[0].event.aggregate.id).is.equalTo(aggregateId);
            assert.that(aggregate.instance.uncommittedEvents[0].event.name).is.equalTo('joined');
            assert.that(aggregate.instance.uncommittedEvents[0].event.data).is.equalTo({
              participant: 'Jane Doe'
            });
            assert.that(aggregate.instance.uncommittedEvents[0].event.initiator.id).is.equalTo(token.sub);
            assert.that(aggregate.instance.uncommittedEvents[0].event.metadata.revision).is.equalTo(1);

            assert.that(aggregate.instance.uncommittedEvents[1].event.context.name).is.equalTo('planning');
            assert.that(aggregate.instance.uncommittedEvents[1].event.aggregate.name).is.equalTo('peerGroup');
            assert.that(aggregate.instance.uncommittedEvents[1].event.aggregate.id).is.equalTo(aggregateId);
            assert.that(aggregate.instance.uncommittedEvents[1].event.name).is.equalTo('joined');
            assert.that(aggregate.instance.uncommittedEvents[1].event.data).is.equalTo({
              participant: 'John Doe'
            });
            assert.that(aggregate.instance.uncommittedEvents[1].event.initiator.id).is.equalTo(token.sub);
            assert.that(aggregate.instance.uncommittedEvents[1].event.metadata.revision).is.equalTo(2);
          });

          test('sets the correlation and the causation id of the new event.', async () => {
            const token = { sub: '6db3ef6a-a607-40cc-8108-65e81816b320' };

            command.addInitiator({ token });

            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            aggregate.api.forCommands.events.publish('joined', {
              participant: 'Jane Doe'
            });

            aggregate.api.forCommands.events.publish('joined', {
              participant: 'John Doe'
            });

            assert.that(aggregate.instance.uncommittedEvents.length).is.equalTo(2);
            assert.that(aggregate.instance.uncommittedEvents[0].event.metadata.correlationId).is.equalTo(command.metadata.correlationId);
            assert.that(aggregate.instance.uncommittedEvents[0].event.metadata.causationId).is.equalTo(command.id);
            assert.that(aggregate.instance.uncommittedEvents[1].event.metadata.correlationId).is.equalTo(command.metadata.correlationId);
            assert.that(aggregate.instance.uncommittedEvents[1].event.metadata.causationId).is.equalTo(command.id);
          });

          test('does not increase the aggregate revision.', async () => {
            const token = { sub: '6db3ef6a-a607-40cc-8108-65e81816b320' };

            command.addInitiator({ token });

            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            aggregate.api.forCommands.events.publish('joined', {
              participant: 'Jane Doe'
            });

            assert.that(aggregate.instance.revision).is.equalTo(0);
          });

          test('updates the aggregate state.', async () => {
            const token = { sub: '6db3ef6a-a607-40cc-8108-65e81816b320' };

            command.addInitiator({ token });

            const aggregate = new WritableAggregate({
              domain,
              context: { name: 'planning' },
              aggregate: { name: 'peerGroup', id: aggregateId },
              command
            });

            aggregate.api.forCommands.events.publish('joined', {
              participant: 'Jane Doe'
            });

            assert.that(aggregate.api.forCommands.state.participants).is.equalTo([ 'Jane Doe' ]);
          });
        });
      });
    });
  });

  suite('applySnapshot', () => {
    test('is a function.', async () => {
      const aggregate = new WritableAggregate({
        domain,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        command
      });

      assert.that(aggregate.applySnapshot).is.ofType('function');
    });

    test('throws an error if snapshot is missing.', async () => {
      const aggregate = new WritableAggregate({
        domain,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        command
      });

      assert.that(() => {
        aggregate.applySnapshot();
      }).is.throwing('Snapshot is missing.');
    });

    test('overwrites the revision.', async () => {
      const aggregate = new WritableAggregate({
        domain,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        command
      });

      const snapshot = {
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
        revision: 23
      };

      aggregate.applySnapshot(snapshot);

      assert.that(aggregate.instance.revision).is.equalTo(23);
    });

    test('overwrites the state.', async () => {
      const aggregate = new WritableAggregate({
        domain,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        command
      });

      const snapshot = {
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
        evision: 23
      };

      aggregate.applySnapshot(snapshot);

      assert.that(aggregate.api.forReadOnly.state).is.equalTo(snapshot.state);
      assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
      assert.that(aggregate.api.forCommands.state).is.sameAs(aggregate.api.forReadOnly.state);
    });
  });
});
