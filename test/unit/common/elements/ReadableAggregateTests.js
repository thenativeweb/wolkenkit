'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { ReadableAggregate } = require('../../../../common/elements'),
      validUpdateInitialState = require('../../../shared/applications/valid/updateInitialState');

suite('ReadableAggregate', () => {
  let application;

  setup(async () => {
    const directory = await validUpdateInitialState();

    application = await Application.load({ directory });
  });

  test('is a function.', async () => {
    assert.that(ReadableAggregate).is.ofType('function');
  });

  test('throws an error if application is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Application is missing.');
  });

  test('throws an error if context is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        application,
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Context is missing.');
  });

  test('throws an error if context name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        application,
        context: {},
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Context name is missing.');
  });

  test('throws an error if aggregate is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        application,
        context: { name: 'sampleContext' }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate is missing.');
  });

  test('throws an error if aggregate name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        application,
        context: { name: 'sampleContext' },
        aggregate: { id: uuid() }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate name is missing.');
  });

  test('throws an error if aggregate id is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate' }
      });
      /* eslint-enable no-new */
    }).is.throwing('Aggregate id is missing.');
  });

  test('throws an error if context does not exist.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ReadableAggregate({
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
      new ReadableAggregate({
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

        const aggregate = new ReadableAggregate({
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

        const aggregate = new ReadableAggregate({
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

        const aggregate = new ReadableAggregate({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        });

        assert.that(aggregate.instance.id).is.equalTo(aggregateId);
      });
    });

    suite('revision', () => {
      test('is 0.', async () => {
        const aggregate = new ReadableAggregate({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() }
        });

        assert.that(aggregate.instance.revision).is.equalTo(0);
      });
    });

    suite('uncommitted events', () => {
      test('is an empty array.', async () => {
        const aggregate = new ReadableAggregate({
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

        const aggregate = new ReadableAggregate({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        });

        assert.that(aggregate.instance.exists).is.ofType('function');
      });

      test('returns false if revision is 0.', async () => {
        const aggregateId = uuid();

        const aggregate = new ReadableAggregate({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        });

        assert.that(aggregate.instance.exists()).is.false();
      });

      test('returns true if revision is greater than 0.', async () => {
        const aggregateId = uuid();

        const aggregate = new ReadableAggregate({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
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
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id }
        });

        assert.that(aggregate.api.forReadOnly.id).is.equalTo(id);
      });

      suite('state', () => {
        test('contains the initial state.', async () => {
          const aggregate = new ReadableAggregate({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          assert.that(aggregate.api.forReadOnly.state).is.equalTo(application.initialState.internal.sampleContext.sampleAggregate);
        });

        test('is a deep copy.', async () => {
          const aggregate = new ReadableAggregate({
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

          const aggregate = new ReadableAggregate({
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

        const aggregate = new ReadableAggregate({
          application,
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id }
        });

        assert.that(aggregate.api.forEvents.id).is.equalTo(id);
      });

      suite('state', () => {
        test('references the read-only api state.', async () => {
          const aggregate = new ReadableAggregate({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          assert.that(aggregate.api.forEvents.state).is.sameAs(aggregate.api.forReadOnly.state);
        });
      });

      suite('setState', () => {
        test('is a function.', async () => {
          const aggregate = new ReadableAggregate({
            application,
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() }
          });

          assert.that(aggregate.api.forEvents.setState).is.ofType('function');
        });

        test('updates the state.', async () => {
          const aggregate = new ReadableAggregate({
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
          const aggregate = new ReadableAggregate({
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
      const aggregate = new ReadableAggregate({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });

      assert.that(aggregate.applySnapshot).is.ofType('function');
    });

    test('throws an error if snapshot is missing.', async () => {
      const aggregate = new ReadableAggregate({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
      });

      assert.that(() => {
        aggregate.applySnapshot();
      }).is.throwing('Snapshot is missing.');
    });

    test('overwrites the revision.', async () => {
      const aggregate = new ReadableAggregate({
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
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
        application,
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() }
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
