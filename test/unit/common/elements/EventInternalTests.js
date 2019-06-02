'use strict';

const path = require('path');

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { EventExternal, EventInternal } = require('../../../../common/elements');

suite('EventInternal', () => {
  suite('create', () => {
    test('is a function.', async () => {
      assert.that(EventInternal.create).is.ofType('function');
    });

    getOptionTests({
      options: {
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: {
          state: {},
          previousState: {}
        }
      },
      excludes: [ 'metadata.initiator.*' ],
      run (options) {
        EventInternal.create(options);
      }
    });

    test('returns an internal event.', async () => {
      const aggregateId = uuid();

      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleEvent',
        data: { foo: 'bar' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: {
          state: { foo: 'bar' },
          previousState: { foo: 'baz' }
        }
      });

      assert.that(event).is.instanceOf(EventInternal);
      assert.that(event.context.name).is.equalTo('sampleContext');
      assert.that(event.aggregate.name).is.equalTo('sampleAggregate');
      assert.that(event.aggregate.id).is.equalTo(aggregateId);
      assert.that(event.name).is.equalTo('sampleEvent');
      assert.that(event.id).is.ofType('string');
      assert.that(uuid.is(event.id)).is.true();
      assert.that(event.data).is.equalTo({ foo: 'bar' });
      assert.that(event.metadata.timestamp).is.ofType('number');
      assert.that(event.metadata.isPublished).is.false();
      assert.that(event.metadata.correlationId).is.equalTo(event.id);
      assert.that(event.metadata.causationId).is.equalTo(event.id);
      assert.that(event.metadata.revision.aggregate).is.equalTo(1);
      assert.that(event.metadata.revision.global).is.null();
      assert.that(event.annotations).is.equalTo({
        state: { foo: 'bar' },
        previousState: { foo: 'baz' }
      });
    });
  });

  suite('fromObject', () => {
    test('is a function.', async () => {
      assert.that(EventInternal.fromObject).is.ofType('function');
    });

    getOptionTests({
      options: {
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        id: uuid(),
        data: { foo: 'bar' },
        metadata: {
          timestamp: Date.now(),
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1, global: null },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: {
          state: {},
          previousState: {}
        }
      },
      excludes: [ 'data.foo', 'metadata.initiator.*' ],
      run (options) {
        EventInternal.fromObject(options);
      }
    });

    test('returns a real internal event object.', async () => {
      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));
      const actual = EventInternal.fromObject(deserializedEvent);

      assert.that(actual).is.instanceOf(EventInternal);
    });

    test('throws an error when the original metadata are malformed.', async () => {
      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      deserializedEvent.metadata.timestamp = 'malformed';

      assert.that(() => {
        EventInternal.fromObject(deserializedEvent);
      }).is.throwing('Invalid type: string should be number (at event.metadata.timestamp).');
    });
  });

  suite('validate', () => {
    let application;

    setup(async () => {
      const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

      application = await Application.load({ directory });
    });

    test('is a function.', async () => {
      assert.that(EventInternal.validate).is.ofType('function');
    });

    test('throws an error if event is missing.', async () => {
      assert.that(() => {
        EventInternal.validate({ application });
      }).is.throwing('Event is missing.');
    });

    test('throws an error if application is missing.', async () => {
      assert.that(() => {
        EventInternal.validate({ event: {}});
      }).is.throwing('Application is missing.');
    });

    test('throws an error if event is malformed.', async () => {
      assert.that(() => {
        EventInternal.validate({ event: {}, application });
      }).is.throwing('Malformed event.');
    });

    test('throws an error if context name is invalid.', async () => {
      assert.that(() => {
        EventInternal.validate({
          event: EventInternal.create({
            context: { name: 'nonExistent' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              causationId: uuid(),
              correlationId: uuid(),
              revision: { aggregate: 1 }
            },
            annotations: {
              state: {},
              previousState: {}
            }
          }),
          application
        });
      }).is.throwing('Invalid context name.');
    });

    test('throws an error if aggregate name is invalid.', async () => {
      assert.that(() => {
        EventInternal.validate({
          event: EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'nonExistent', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              causationId: uuid(),
              correlationId: uuid(),
              revision: { aggregate: 1 }
            },
            annotations: {
              state: {},
              previousState: {}
            }
          }),
          application
        });
      }).is.throwing('Invalid aggregate name.');
    });

    test('throws an error if event name is invalid.', async () => {
      assert.that(() => {
        EventInternal.validate({
          event: EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'nonExistent',
            data: { strategy: 'succeed' },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              causationId: uuid(),
              correlationId: uuid(),
              revision: { aggregate: 1 }
            },
            annotations: {
              state: {},
              previousState: {}
            }
          }),
          application
        });
      }).is.throwing('Invalid event name.');
    });

    test('throws an error if the schema does not match.', async () => {
      assert.that(() => {
        EventInternal.validate({
          event: EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'nonExistent' },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              causationId: uuid(),
              correlationId: uuid(),
              revision: { aggregate: 1 }
            },
            annotations: {
              state: {},
              previousState: {}
            }
          }),
          application
        });
      }).is.throwing('No enum match (nonExistent), expects: succeed, fail, reject (at event.data.strategy).');
    });

    test('does not throw an error if the schema matches.', async () => {
      assert.that(() => {
        EventInternal.validate({
          event: EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              causationId: uuid(),
              correlationId: uuid(),
              revision: { aggregate: 1 }
            },
            annotations: {
              state: {},
              previousState: {}
            }
          }),
          application
        });
      }).is.not.throwing();
    });
  });

  suite('instance', () => {
    let event;

    setup(async () => {
      event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: {
          state: {},
          previousState: {}
        }
      });
    });

    suite('clone', () => {
      test('is a function.', async () => {
        assert.that(event.clone).is.ofType('function');
      });

      test('returns a cloned event.', async () => {
        const clonedEvent = event.clone();

        assert.that(clonedEvent).is.equalTo(event);
        assert.that(clonedEvent).is.not.sameAs(event);
      });
    });

    suite('setData', () => {
      test('is a function.', async () => {
        assert.that(event.setData).is.ofType('function');
      });

      test('throws an error if data is missing.', async () => {
        assert.that(() => {
          event.setData({});
        }).is.throwing('Data is missing.');
      });

      test('returns a new event with the given data.', async () => {
        const updatedEvent = event.setData({ data: { foo: 'bar' }});

        assert.that(updatedEvent.context).is.equalTo(event.context);
        assert.that(updatedEvent.aggregate).is.equalTo(event.aggregate);
        assert.that(updatedEvent.name).is.equalTo(event.name);
        assert.that(updatedEvent.id).is.equalTo(event.id);
        assert.that(updatedEvent.data).is.equalTo({ foo: 'bar' });
        assert.that(updatedEvent.metadata).is.equalTo(event.metadata);
        assert.that(updatedEvent.annotations).is.equalTo(event.annotations);
        assert.that(updatedEvent).is.not.sameAs(event);
      });
    });

    suite('setRevisionGlobal', () => {
      test('is a function.', async () => {
        assert.that(event.setRevisionGlobal).is.ofType('function');
      });

      test('throws an error if revision global is missing.', async () => {
        assert.that(() => {
          event.setRevisionGlobal({});
        }).is.throwing('Revision global is missing.');
      });

      test('returns a new event with the given global revision.', async () => {
        const updatedEvent = event.setRevisionGlobal({ revisionGlobal: 1 });

        assert.that(updatedEvent.context).is.equalTo(event.context);
        assert.that(updatedEvent.aggregate).is.equalTo(event.aggregate);
        assert.that(updatedEvent.name).is.equalTo(event.name);
        assert.that(updatedEvent.id).is.equalTo(event.id);
        assert.that(updatedEvent.data).is.equalTo(event.data);
        assert.that(updatedEvent.metadata).is.equalTo({
          ...event.metadata,
          revision: {
            ...event.metadata.revision,
            global: 1
          }
        });
        assert.that(updatedEvent.annotations).is.equalTo(event.annotations);
        assert.that(updatedEvent).is.not.sameAs(event);
      });
    });

    suite('markAsPublished', () => {
      test('is a function.', async () => {
        assert.that(event.markAsPublished).is.ofType('function');
      });

      test('returns a new event that is marked as published.', async () => {
        const publishedEvent = event.markAsPublished();

        assert.that(publishedEvent.context).is.equalTo(event.context);
        assert.that(publishedEvent.aggregate).is.equalTo(event.aggregate);
        assert.that(publishedEvent.name).is.equalTo(event.name);
        assert.that(publishedEvent.id).is.equalTo(event.id);
        assert.that(publishedEvent.data).is.equalTo(event.data);
        assert.that(publishedEvent.metadata).is.equalTo({
          ...event.metadata,
          isPublished: true
        });
        assert.that(publishedEvent.annotations).is.equalTo(event.annotations);
        assert.that(publishedEvent).is.not.sameAs(event);
      });
    });

    suite('asExternal', () => {
      test('is a function.', async () => {
        assert.that(event.asExternal).is.ofType('function');
      });

      test('returns an external event.', async () => {
        const externalEvent = event.asExternal();

        assert.that(externalEvent).is.instanceOf(EventExternal);
        assert.that(externalEvent.context).is.equalTo(event.context);
        assert.that(externalEvent.aggregate).is.equalTo(event.aggregate);
        assert.that(externalEvent.name).is.equalTo(event.name);
        assert.that(externalEvent.id).is.equalTo(event.id);
        assert.that(externalEvent.data).is.equalTo(event.data);
        assert.that(externalEvent.metadata).is.equalTo(event.metadata);
      });
    });
  });
});
