import assert from 'assertthat';
import EventExternal from '../../../../lib/common/elements/EventExternal';
import uuid from 'uuidv4';

suite('EventExternal', (): void => {
  suite('create', (): void => {
    test('returns an external event.', async (): Promise<void> => {
      const aggregateId = uuid();

      const event = EventExternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleEvent',
        data: {
          foo: 'bar'
        },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
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
    });
  });

  suite('deserialize', (): void => {
    test('returns a real external event.', async (): Promise<void> => {
      const event = EventExternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));
      const actual = EventExternal.deserialize(deserializedEvent);

      assert.that(actual).is.equalTo(deserializedEvent);
    });

    test('throws an error when the original metadata are malformed.', async (): Promise<void> => {
      const event = EventExternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      deserializedEvent.metadata.timestamp = 'malformed';

      assert.that((): void => {
        EventExternal.deserialize(deserializedEvent);
      }).is.throwing('Invalid type: string should be number (at event.metadata.timestamp).');
    });
  });

  suite('instance', (): void => {
    let event: EventExternal;

    setup(async (): Promise<void> => {
      event = EventExternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleEvent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
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
        assert.that(publishedEvent).is.not.sameAs(event);
      });
    });
  });
});
