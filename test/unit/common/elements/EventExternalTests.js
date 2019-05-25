'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      uuid = require('uuidv4');

const { EventExternal } = require('../../../../common/elements');

suite('EventExternal', () => {
  suite('create', () => {
    test('is a function.', async () => {
      assert.that(EventExternal.create).is.ofType('function');
    });

    getOptionTests({
      options: {
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: {
            user: { id: uuid(), claims: { sub: uuid() }}
          }
        }
      },
      excludes: [ 'metadata.initiator.*' ],
      run (options) {
        EventExternal.create(options);
      }
    });

    test('returns an external event.', async () => {
      const aggregateId = uuid();

      const event = EventExternal.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: aggregateId
        },
        name: 'sampleEvent',
        data: {
          foo: 'bar'
        },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      assert.that(event).is.instanceOf(EventExternal);
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
    });
  });

  suite('fromObject', () => {
    test('is a function.', async () => {
      assert.that(EventExternal.fromObject).is.ofType('function');
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
        }
      },
      excludes: [ 'data.foo', 'metadata.initiator.*' ],
      run (options) {
        EventExternal.fromObject(options);
      }
    });

    test('returns a real external event.', async () => {
      const event = EventExternal.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));
      const actual = EventExternal.fromObject(deserializedEvent);

      assert.that(actual).is.instanceOf(EventExternal);
    });

    test('throws an error when the original metadata are malformed.', async () => {
      const event = EventExternal.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      deserializedEvent.metadata.timestamp = 'malformed';

      assert.that(() => {
        EventExternal.fromObject(deserializedEvent);
      }).is.throwing('Invalid type: string should be number (at event.metadata.timestamp).');
    });
  });

  suite('instance', () => {
    let event;

    setup(async () => {
      event = EventExternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
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
        assert.that(publishedEvent).is.not.sameAs(event);
      });
    });
  });
});
