'use strict';

const assert = require('assertthat'),
      capitalize = require('lodash/capitalize'),
      cloneDeep = require('lodash/cloneDeep'),
      getFlatObjectKeys = require('flat-object-keys'),
      lowerCase = require('lodash/lowerCase'),
      unset = require('lodash/unset'),
      uuid = require('uuidv4');

const { Event } = require('../../../../common/elements');

suite('Event', () => {
  suite('create', () => {
    test('is a function.', async () => {
      assert.that(Event.create).is.ofType('function');
    });

    suite('parameters', () => {
      const options = {
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleEvent',
        metadata: {
          revision: {
            aggregate: 1
          },
          initiator: {
            user: { id: uuid(), claims: { sub: uuid() }}
          }
        }
      };

      const paths = getFlatObjectKeys({ from: options });

      for (const path of paths) {
        const spacedPath = lowerCase(path);
        const capitalizedPath = capitalize(spacedPath);

        /* eslint-disable no-loop-func */
        test(`throws an error when no ${spacedPath} is given.`, async () => {
          const clonedOptions = cloneDeep(options);

          unset(clonedOptions, path);

          assert.that(() => {
            Event.create(clonedOptions);
          }).is.throwing(`${capitalizedPath} is missing.`);
        });
        /* eslint-enable no-loop-func */
      }
    });

    test('returns an event.', async () => {
      const aggregateId = uuid();

      const event = Event.create({
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
          revision: {
            aggregate: 1
          },
          initiator: {
            user: { id: uuid(), claims: { sub: uuid() }}
          }
        }
      });

      assert.that(event).is.instanceOf(Event);
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
      assert.that(event.annotations).is.equalTo({});
    });

    test('returns an event with annotations.', async () => {
      const aggregateId = uuid();
      const userId = uuid();

      const event = Event.create({
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
          revision: {
            aggregate: 1
          },
          initiator: {
            user: { id: userId, claims: { sub: userId }}
          }
        },
        annotations: {
          client: {
            token: '...',
            user: { id: userId, claims: { sub: userId }},
            ip: '127.0.0.1'
          }
        }
      });

      assert.that(event).is.instanceOf(Event);
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
        client: {
          token: '...',
          user: { id: userId, claims: { sub: userId }},
          ip: '127.0.0.1'
        }
      });
    });
  });

  suite('fromObject', () => {
    test('is a function.', async () => {
      assert.that(Event.fromObject).is.ofType('function');
    });

    suite('parameters', () => {
      const id = uuid();
      const aggregateId = uuid(),
            userId = uuid();

      const options = {
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: aggregateId
        },
        name: 'sampleEvent',
        id,
        data: {
          foo: 'bar'
        },
        metadata: {
          timestamp: Date.now(),
          causationId: id,
          correlationId: id,
          revision: { aggregate: 1, global: null },
          initiator: { user: { id: userId, claims: { sub: userId }}}
        },
        annotations: {
          client: {
            token: '...',
            user: { id: userId, claims: { sub: userId }},
            ip: '127.0.0.1'
          }
        }
      };

      const paths = getFlatObjectKeys({ from: options, excludes: [ 'data.foo', 'annotations.client' ]});

      for (const path of paths) {
        const spacedPath = lowerCase(path);
        const capitalizedPath = capitalize(spacedPath);

        /* eslint-disable no-loop-func */
        test(`throws an error when no ${spacedPath} is given.`, async () => {
          const clonedOptions = cloneDeep(options);

          unset(clonedOptions, path);

          assert.that(() => {
            Event.fromObject(clonedOptions);
          }).is.throwing(`${capitalizedPath} is missing.`);
        });
        /* eslint-enable no-loop-func */
      }
    });

    test('returns a real event object.', async () => {
      const event = Event.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleEvent',
        metadata: {
          revision: {
            aggregate: 1
          },
          initiator: {
            user: { id: uuid(), claims: { sub: uuid() }}
          }
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      const actual = Event.fromObject(deserializedEvent);

      assert.that(actual).is.instanceOf(Event);
    });

    test('throws an error when the original metadata are malformed.', async () => {
      const event = Event.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleEvent',
        metadata: {
          revision: {
            aggregate: 1
          },
          initiator: {
            user: { id: uuid(), claims: { sub: uuid() }}
          }
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      deserializedEvent.metadata.timestamp = 'malformed';

      assert.that(() => {
        Event.fromObject(deserializedEvent);
      }).is.throwing('Invalid type: string should be number (at event.metadata.timestamp).');
    });

    test('keeps annotations.', async () => {
      const event = Event.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleEvent',
        metadata: {
          revision: {
            aggregate: 1
          },
          initiator: {
            user: { id: uuid(), claims: { sub: uuid() }}
          }
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      const actual = Event.fromObject(deserializedEvent);

      assert.that(actual.annotations).is.equalTo(event.annotations);
    });
  });

  suite('instance', () => {
    let event;

    setup(async () => {
      const userId = uuid();

      event = Event.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleEvent',
        metadata: {
          revision: {
            aggregate: 1
          },
          initiator: {
            user: { id: uuid(), claims: { sub: uuid() }}
          }
        },
        annotations: {
          client: {
            token: '...',
            user: { id: userId, claims: { sub: userId }},
            ip: '127.0.0.1'
          }
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

    suite('withoutAnnotations', () => {
      test('is a function.', async () => {
        assert.that(event.withoutAnnotations).is.ofType('function');
      });

      test('returns a new event without annotations.', async () => {
        const eventWithoutAnnotations = event.withoutAnnotations();

        assert.that(eventWithoutAnnotations).is.not.sameAs(event);
        assert.that(eventWithoutAnnotations.context).is.equalTo(event.context);
        assert.that(eventWithoutAnnotations.aggregate).is.equalTo(event.aggregate);
        assert.that(eventWithoutAnnotations.name).is.equalTo(event.name);
        assert.that(eventWithoutAnnotations.id).is.equalTo(event.id);
        assert.that(eventWithoutAnnotations.data).is.equalTo(event.data);
        assert.that(eventWithoutAnnotations.metadata).is.equalTo(event.metadata);
      });
    });
  });
});
