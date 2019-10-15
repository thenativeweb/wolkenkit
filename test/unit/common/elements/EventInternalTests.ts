import Application from '../../../../src/common/application';
import assert from 'assertthat';
import EventInternal from '../../../../src/common/elements/EventInternal';
import path from 'path';
import uuid from 'uuidv4';

suite('EventInternal', (): void => {
  suite('create', (): void => {
    test('returns an internal event.', async (): Promise<void> => {
      const aggregateId = uuid();

      const event = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
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

      assert.that(event.contextIdentifier.name).is.equalTo('sampleContext');
      assert.that(event.aggregateIdentifier.name).is.equalTo('sampleAggregate');
      assert.that(event.aggregateIdentifier.id).is.equalTo(aggregateId);
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

  suite('deserialize', (): void => {
    test('returns a real internal event object.', async (): Promise<void> => {
      const event = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));
      const actual = EventInternal.deserialize(deserializedEvent);

      assert.that(actual).is.equalTo(deserializedEvent);
    });

    test('throws an error when the original metadata are malformed.', async (): Promise<void> => {
      const event = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      deserializedEvent.metadata.timestamp = 'malformed';

      assert.that((): void => {
        EventInternal.deserialize(deserializedEvent);
      }).is.throwing('Invalid type: string should be number (at event.metadata.timestamp).');
    });
  });

  suite('validate', (): void => {
    let application: Application;

    setup(async (): Promise<void> => {
      const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

      application = await Application.load({ directory });
    });

    test('throws an error if event is malformed.', async (): Promise<void> => {
      assert.that((): void => {
        EventInternal.validate({ event: {}, application });
      }).is.throwing('Event malformed.');
    });

    test('throws an error if context name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        EventInternal.validate({
          event: EventInternal.create({
            contextIdentifier: { name: 'nonExistent' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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

    test('throws an error if aggregate name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        EventInternal.validate({
          event: EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'nonExistent', id: uuid() },
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

    test('throws an error if event name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        EventInternal.validate({
          event: EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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

    test('throws an error if the schema does not match.', async (): Promise<void> => {
      assert.that((): void => {
        EventInternal.validate({
          event: EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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

    test('does not throw an error if the schema matches.', async (): Promise<void> => {
      assert.that((): void => {
        EventInternal.validate({
          event: EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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

  suite('instance', (): void => {
    let event: EventInternal;

    setup(async (): Promise<void> => {
      event = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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

    suite('setData', (): void => {
      test('returns a new event with the given data.', async (): Promise<void> => {
        const updatedEvent = event.setData({ data: { foo: 'bar' }});

        assert.that(updatedEvent.contextIdentifier).is.equalTo(event.contextIdentifier);
        assert.that(updatedEvent.aggregateIdentifier).is.equalTo(event.aggregateIdentifier);
        assert.that(updatedEvent.name).is.equalTo(event.name);
        assert.that(updatedEvent.id).is.equalTo(event.id);
        assert.that(updatedEvent.data).is.equalTo({ foo: 'bar' });
        assert.that(updatedEvent.metadata).is.equalTo(event.metadata);
        assert.that(updatedEvent.annotations).is.equalTo(event.annotations);
        assert.that(updatedEvent).is.not.sameAs(event);
      });
    });

    suite('setRevisionGlobal', (): void => {
      test('returns a new event with the given global revision.', async (): Promise<void> => {
        const updatedEvent = event.setRevisionGlobal({ revisionGlobal: 1 });

        assert.that(updatedEvent.contextIdentifier).is.equalTo(event.contextIdentifier);
        assert.that(updatedEvent.aggregateIdentifier).is.equalTo(event.aggregateIdentifier);
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

    suite('markAsPublished', (): void => {
      test('returns a new event that is marked as published.', async (): Promise<void> => {
        const publishedEvent = event.markAsPublished();

        assert.that(publishedEvent.contextIdentifier).is.equalTo(event.contextIdentifier);
        assert.that(publishedEvent.aggregateIdentifier).is.equalTo(event.aggregateIdentifier);
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

    suite('asExternal', (): void => {
      test('returns an external event.', async (): Promise<void> => {
        const externalEvent = event.asExternal();

        assert.that(externalEvent.contextIdentifier).is.equalTo(event.contextIdentifier);
        assert.that(externalEvent.aggregateIdentifier).is.equalTo(event.aggregateIdentifier);
        assert.that(externalEvent.name).is.equalTo(event.name);
        assert.that(externalEvent.id).is.equalTo(event.id);
        assert.that(externalEvent.data).is.equalTo(event.data);
        assert.that(externalEvent.metadata).is.equalTo(event.metadata);
      });
    });
  });
});
