'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { ReadableAggregate } = require('../../../../common/elements'),
      writeModel = require('./writeModel');

suite('ReadableAggregate', () => {
  test('is a function.', async () => {
    assert.that(ReadableAggregate).is.ofType('function');
  });

  test('throws an error if write model is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({});
      /* eslint-enable no-new */
    }).is.throwing('Write model is missing.');
  });

  test('throws an error if context is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({ writeModel });
      /* eslint-enable no-new */
    }).is.throwing('Context is missing.');
  });

  test('throws an error if context name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        writeModel,
        context: {}
      });
      /* eslint-enable no-new */
    }).is.throwing('Context name is missing.');
  });

  test('throws an error if aggregate is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        writeModel,
        context: { name: 'planning' }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate is missing.');
  });

  test('throws an error if aggregate name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        writeModel,
        context: { name: 'planning' },
        aggregate: {}
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate name is missing.');
  });

  test('throws an error if aggregate id is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        writeModel,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup' }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate id is missing.');
  });

  test('throws an error if context does not exist.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        writeModel,
        context: { name: 'non-existent' },
        aggregate: { name: 'peerGroup', id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Context does not exist.');
  });

  test('throws an error if aggregate does not exist.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        writeModel,
        context: { name: 'planning' },
        aggregate: { name: 'non-existent', id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate does not exist.');
  });

  suite('definition', () => {
    test('contains the appropriate aggregate definition from the write model.', async () => {
      const aggregate = new ReadableAggregate({
        writeModel,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() }
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
    });
  });

  suite('instance', () => {
    suite('id', () => {
      test('contains the requested aggregate\'s id.', async () => {
        const aggregateId = uuid();

        const aggregate = new ReadableAggregate({
          writeModel,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: aggregateId }
        });

        assert.that(aggregate.instance.id).is.equalTo(aggregateId);
      });
    });

    suite('revision', () => {
      test('is 0.', async () => {
        const aggregate = new ReadableAggregate({
          writeModel,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() }
        });

        assert.that(aggregate.instance.revision).is.equalTo(0);
      });
    });

    suite('uncommitted events', () => {
      test('is an empty array.', async () => {
        const aggregate = new ReadableAggregate({
          writeModel,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() }
        });

        assert.that(aggregate.instance.uncommittedEvents).is.equalTo([]);
      });
    });

    suite('exists', () => {
      test('is a function.', async () => {
        const aggregateId = uuid();

        const aggregate = new ReadableAggregate({
          writeModel,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: aggregateId }
        });

        assert.that(aggregate.instance.exists).is.ofType('function');
      });

      test('returns false if revision is 0.', async () => {
        const aggregateId = uuid();

        const aggregate = new ReadableAggregate({
          writeModel,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: aggregateId }
        });

        assert.that(aggregate.instance.exists()).is.false();
      });

      test('returns true if revision is greater than 0.', async () => {
        const aggregateId = uuid();

        const aggregate = new ReadableAggregate({
          writeModel,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: aggregateId }
        });

        const snapshot = {
          state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
          revision: 23
        };

        aggregate.applySnapshot(snapshot);

        assert.that(aggregate.instance.exists()).is.true();
      });
    });
  });

  suite('api', () => {
    suite('forReadOnly', () => {
      test('contains the aggregate id.', async () => {
        const id = uuid();

        const aggregate = new ReadableAggregate({
          writeModel,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id }
        });

        assert.that(aggregate.api.forReadOnly.id).is.equalTo(id);
      });

      suite('state', () => {
        test('contains the initial state.', async () => {
          const aggregate = new ReadableAggregate({
            writeModel,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: uuid() }
          });

          assert.that(aggregate.api.forReadOnly.state).is.equalTo(writeModel.planning.peerGroup.initialState);
        });

        test('is a deep copy.', async () => {
          const aggregate = new ReadableAggregate({
            writeModel,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: uuid() }
          });

          assert.that(aggregate.api.forReadOnly.state).is.not.sameAs(writeModel.planning.peerGroup.initialState);
        });
      });

      suite('exists', () => {
        test('references the instance exists function.', async () => {
          const aggregateId = uuid();

          const aggregate = new ReadableAggregate({
            writeModel,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: aggregateId }
          });

          assert.that(aggregate.api.forReadOnly.exists).is.sameAs(aggregate.instance.exists);
        });
      });
    });

    suite('forEvents', () => {
      test('contains the aggregate id.', async () => {
        const id = uuid();

        const aggregate = new ReadableAggregate({
          writeModel,
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id }
        });

        assert.that(aggregate.api.forEvents.id).is.equalTo(id);
      });

      suite('state', () => {
        test('references the read-only api state.', async () => {
          const aggregate = new ReadableAggregate({
            writeModel,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: uuid() }
          });

          assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
        });
      });

      suite('setState', () => {
        test('is a function.', async () => {
          const aggregate = new ReadableAggregate({
            writeModel,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: uuid() }
          });

          assert.that(aggregate.api.forEvents.setState).is.ofType('function');
        });

        test('updates the state.', async () => {
          const aggregate = new ReadableAggregate({
            writeModel,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: uuid() }
          });

          assert.that(aggregate.api.forEvents.state.initiator).is.undefined();
          assert.that(aggregate.api.forEvents.state.destination).is.undefined();
          assert.that(aggregate.api.forEvents.state.participants).is.equalTo([]);

          aggregate.api.forEvents.setState({
            initiator: 'Jane Doe',
            participants: [ 'Jane Doe' ]
          });

          assert.that(aggregate.api.forEvents.state.initiator).is.equalTo('Jane Doe');
          assert.that(aggregate.api.forEvents.state.destination).is.undefined();
          assert.that(aggregate.api.forEvents.state.participants).is.equalTo([ 'Jane Doe' ]);
        });

        test('correctly resets arrays.', async () => {
          const aggregate = new ReadableAggregate({
            writeModel,
            context: { name: 'planning' },
            aggregate: { name: 'peerGroup', id: uuid() }
          });

          aggregate.api.forEvents.setState({
            initiator: 'Jane Doe',
            participants: [ 'Jane Doe' ]
          });

          aggregate.api.forEvents.setState({
            participants: []
          });

          assert.that(aggregate.api.forEvents.state.initiator).is.equalTo('Jane Doe');
          assert.that(aggregate.api.forEvents.state.destination).is.undefined();
          assert.that(aggregate.api.forEvents.state.participants).is.equalTo([]);
        });
      });
    });
  });

  suite('applySnapshot', () => {
    test('is a function.', async () => {
      const aggregate = new ReadableAggregate({
        writeModel,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() }
      });

      assert.that(aggregate.applySnapshot).is.ofType('function');
    });

    test('throws an error if snapshot is missing.', async () => {
      const aggregate = new ReadableAggregate({
        writeModel,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() }
      });

      assert.that(() => {
        aggregate.applySnapshot();
      }).is.throwing('Snapshot is missing.');
    });

    test('overwrites the revision.', async () => {
      const aggregate = new ReadableAggregate({
        writeModel,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() }
      });

      const snapshot = {
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
        revision: 23
      };

      aggregate.applySnapshot(snapshot);

      assert.that(aggregate.instance.revision).is.equalTo(23);
    });

    test('overwrites the state.', async () => {
      const aggregate = new ReadableAggregate({
        writeModel,
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() }
      });

      const snapshot = {
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]},
        revision: 23
      };

      aggregate.applySnapshot(snapshot);

      assert.that(aggregate.api.forReadOnly.state).is.equalTo(snapshot.state);
      assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
    });
  });
});
