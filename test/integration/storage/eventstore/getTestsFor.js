'use strict';

const assert = require('assertthat'),
      toArray = require('streamtoarray'),
      uuid = require('uuidv4');

const { Event } = require('../../../../common/elements');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Eventstore, getOptions }) {
  let eventstore,
      namespace;

  setup(() => {
    eventstore = new Eventstore();
    namespace = uuid();
  });

  teardown(async function () {
    this.timeout(20 * 1000);

    await eventstore.destroy();
  });

  suite('initialize', () => {
    test('does not throw an error if the database is reachable.', async () => {
      await assert.that(async () => {
        await eventstore.initialize({ ...getOptions(), namespace });
      }).is.not.throwingAsync();
    });

    test('does not throw an error if tables, indexes & co. do already exist.', async () => {
      await assert.that(async () => {
        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.initialize({ ...getOptions(), namespace });
      }).is.not.throwingAsync();
    });

    test('throws an error if the aggregate id and revision of the new event are already in use.', async () => {
      const event = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      event.metadata.revision = 1;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});

      await assert.that(async () => {
        await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});
      }).is.throwingAsync('Aggregate id and revision already exist.');
    });

    suite('event stream order', () => {
      test('assigns the position 1 to the first event.', async () => {
        const event = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        event.metadata.revision = 1;

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});

        const eventStream = await eventstore.getEventStream({ aggregateId: event.aggregate.id });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(1);
        assert.that(aggregateEvents[0].metadata.position).is.equalTo(1);
      });

      test('assigns increasing positions to subsequent events.', async () => {
        const eventStarted = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        const eventJoined = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        eventStarted.metadata.revision = 1;
        eventJoined.metadata.revision = 2;

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({
          uncommittedEvents: [
            { event: eventStarted, state: {}},
            { event: eventJoined, state: {}}
          ]
        });

        const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(2);
        assert.that(aggregateEvents[0].metadata.position).is.equalTo(1);
        assert.that(aggregateEvents[1].metadata.position).is.equalTo(2);
      });

      test('assigns increasing positions even when saving the events individually.', async () => {
        const eventStarted = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        const eventJoined = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        eventStarted.metadata.revision = 1;
        eventJoined.metadata.revision = 2;

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({ uncommittedEvents: { event: eventStarted, state: {}}});
        await eventstore.saveEvents({ uncommittedEvents: { event: eventJoined, state: {}}});

        const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(2);
        assert.that(aggregateEvents[0].metadata.position).is.equalTo(1);
        assert.that(aggregateEvents[1].metadata.position).is.equalTo(2);
      });

      test('ensures that positions are unique across aggregates.', async () => {
        const eventStarted1 = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        const eventStarted2 = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        eventStarted1.metadata.revision = 1;
        eventStarted2.metadata.revision = 1;

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({ uncommittedEvents: { event: eventStarted1, state: {}}});
        await eventstore.saveEvents({ uncommittedEvents: { event: eventStarted2, state: {}}});

        const eventStream1 = await eventstore.getEventStream({ aggregateId: eventStarted1.aggregate.id });
        const aggregateEvents1 = await toArray(eventStream1);

        assert.that(aggregateEvents1.length).is.equalTo(1);
        assert.that(aggregateEvents1[0].metadata.position).is.equalTo(1);

        const eventStream2 = await eventstore.getEventStream({ aggregateId: eventStarted2.aggregate.id });
        const aggregateEvents2 = await toArray(eventStream2);

        assert.that(aggregateEvents2.length).is.equalTo(1);
        assert.that(aggregateEvents2[0].metadata.position).is.equalTo(2);
      });

      test('returns the saved events enriched by their positions.', async () => {
        const event = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        event.metadata.revision = 1;

        await eventstore.initialize({ ...getOptions(), namespace });
        const savedEvents = await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});

        assert.that(savedEvents.length).is.equalTo(1);
        assert.that(savedEvents[0].event.metadata.position).is.equalTo(1);
      });

      test('does not change the events that were given as arguments.', async () => {
        const event = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        event.metadata.revision = 1;

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});

        assert.that(event.metadata.position).is.undefined();
      });
    });
  });

  suite('getLastEvent', () => {
    test('returns undefined for an aggregate without events.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const event = await eventstore.getLastEvent(uuid());

      assert.that(event).is.undefined();
    });

    test('returns the last event for the given aggregate.', async () => {
      const aggregateId = uuid();

      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: aggregateId },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoined = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 1;
      eventJoined.metadata.revision = 2;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          { event: eventStarted, state: {}},
          { event: eventJoined, state: {}}
        ]
      });

      const event = await eventstore.getLastEvent(aggregateId);

      assert.that(event.name).is.equalTo('joined');
      assert.that(event.metadata.revision).is.equalTo(2);
    });

    test('correctly handles null, undefined and empty arrays.', async () => {
      const aggregateId = uuid();

      const eventJoined = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: aggregateId },
        name: 'joined',
        data: {
          initiator: null,
          destination: undefined,
          participants: []
        },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventJoined.metadata.revision = 1;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({ uncommittedEvents: [{ event: eventJoined, state: {}}]});

      const event = await eventstore.getLastEvent(aggregateId);

      assert.that(event.data.initiator).is.null();
      assert.that(event.data.participants).is.equalTo([]);
    });
  });

  suite('getEventStream', () => {
    test('returns an empty stream for a non-existent aggregate.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const eventStream = await eventstore.getEventStream({ aggregateId: uuid() });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(0);
    });

    test('returns a stream of events for the given aggregate.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoined = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 1;
      eventJoined.metadata.revision = 2;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          { event: eventStarted, state: {}},
          { event: eventJoined, state: {}}
        ]
      });

      const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(2);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
      assert.that(aggregateEvents[1].name).is.equalTo('joined');
    });

    test('returns a stream from revision.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoined = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 1;
      eventJoined.metadata.revision = 2;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          { event: eventStarted, state: {}},
          { event: eventJoined, state: {}}
        ]
      });

      const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id, fromRevision: 2 });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].name).is.equalTo('joined');
    });

    test('returns a stream to revision.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoined = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 1;
      eventJoined.metadata.revision = 2;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          { event: eventStarted, state: {}},
          { event: eventJoined, state: {}}
        ]
      });

      const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id, toRevision: 1 });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
    });
  });

  suite('getUnpublishedEventStream', () => {
    test('returns an empty stream if there are no unpublished events.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const eventStream = await eventstore.getUnpublishedEventStream();
      const unpublishedEvents = await toArray(eventStream);

      assert.that(unpublishedEvents.length).is.equalTo(0);
    });

    test('returns a stream of unpublished events.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoined = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 1;
      eventStarted.metadata.published = true;
      eventJoined.metadata.revision = 2;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          { event: eventStarted, state: {}},
          { event: eventJoined, state: {}}
        ]
      });

      const eventStream = await eventstore.getUnpublishedEventStream();
      const unpublishedEvents = await toArray(eventStream);

      assert.that(unpublishedEvents.length).is.equalTo(1);
      assert.that(unpublishedEvents[0].name).is.equalTo('joined');
    });
  });

  suite('saveEvents', () => {
    test('saves a single event.', async () => {
      const event = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      event.metadata.revision = 1;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});

      const eventStream = await eventstore.getEventStream({ aggregateId: event.aggregate.id });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
    });

    test('throws an error if events is an empty array.', async () => {
      await assert.that(async () => {
        await eventstore.saveEvents({ uncommittedEvents: []});
      }).is.throwingAsync('Uncommitted events are missing.');
    });

    test('saves multiple events.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoined = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 1;
      eventJoined.metadata.revision = 2;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          { event: eventStarted, state: {}},
          { event: eventJoined, state: {}}
        ]
      });

      const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(2);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
      assert.that(aggregateEvents[1].name).is.equalTo('joined');
    });

    test('returns events with updated positions.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoined = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 1;
      eventJoined.metadata.revision = 2;

      await eventstore.initialize({ ...getOptions(), namespace });
      const savedEvents = await eventstore.saveEvents({
        uncommittedEvents: [
          { event: eventStarted, state: {}},
          { event: eventJoined, state: {}}
        ]
      });

      assert.that(savedEvents.length).is.equalTo(2);
      assert.that(savedEvents[0].event.name).is.equalTo('started');
      assert.that(savedEvents[0].event.metadata.position).is.equalTo(1);
      assert.that(savedEvents[1].event.name).is.equalTo('joined');
      assert.that(savedEvents[1].event.metadata.position).is.equalTo(2);
    });

    test('correctly handles undefined and null.', async () => {
      const event = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: null, destination: undefined },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      event.metadata.revision = 1;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});

      const eventStream = await eventstore.getEventStream({ aggregateId: event.aggregate.id });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].data).is.equalTo({ initiator: null });
    });

    test('throws an error if the event\'s revision is missing.', async () => {
      const event = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      await eventstore.initialize({ ...getOptions(), namespace });

      await assert.that(async () => {
        await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});
      }).is.throwingAsync('Revision is missing.');
    });

    test('throws an error if the event\'s revision is less than 1.', async () => {
      const event = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      event.metadata.revision = 0;

      await eventstore.initialize({ ...getOptions(), namespace });

      await assert.that(async () => {
        await eventstore.saveEvents({ uncommittedEvents: { event, state: {}}});
      }).is.throwingAsync('Revision must not be less than 1.');
    });

    test('saves a snapshot when one of the events has a revision divisible by 100.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoinedFirst = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoinedSecond = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'John Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 99;
      eventJoinedFirst.metadata.revision = 100;
      eventJoinedSecond.metadata.revision = 101;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          {
            event: eventStarted,
            state: { initiator: 'Jane Doe', destination: 'Riva', participants: []}
          },
          {
            event: eventJoinedFirst,
            state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}
          },
          {
            event: eventJoinedSecond,
            state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe', 'John Doe' ]}
          }
        ]
      });

      const snapshot = await eventstore.getSnapshot(eventStarted.aggregate.id);

      assert.that(snapshot).is.equalTo({
        revision: 100,
        state: {
          initiator: 'Jane Doe',
          destination: 'Riva',
          participants: [ 'Jane Doe' ]
        }
      });
    });

    test('does not save a snapshot when none of the events has a revision divisible by 100.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoinedFirst = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoinedSecond = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'John Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 102;
      eventJoinedFirst.metadata.revision = 103;
      eventJoinedSecond.metadata.revision = 104;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          {
            event: eventStarted,
            state: { initiator: 'Jane Doe', destination: 'Riva', participants: []}
          },
          {
            event: eventJoinedFirst,
            state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}
          },
          {
            event: eventJoinedSecond,
            state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe', 'John Doe' ]}
          }
        ]
      });

      const snapshot = await eventstore.getSnapshot(eventStarted.aggregate.id);

      assert.that(snapshot).is.undefined();
    });
  });

  suite('markEventsAsPublished', () => {
    test('marks the specified events as published.', async () => {
      const eventStarted = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoinedFirst = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      const eventJoinedSecond = new Event({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jennifer Doe' },
        metadata: { correlationId: uuid(), causationId: uuid() }
      });

      eventStarted.metadata.revision = 1;
      eventJoinedFirst.metadata.revision = 2;
      eventJoinedSecond.metadata.revision = 3;

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [
          { event: eventStarted, state: {}},
          { event: eventJoinedFirst, state: {}},
          { event: eventJoinedSecond, state: {}}
        ]
      });

      await eventstore.markEventsAsPublished({
        aggregateId: eventStarted.aggregate.id,
        fromRevision: 1,
        toRevision: 2
      });

      const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents[0].metadata.published).is.true();
      assert.that(aggregateEvents[1].metadata.published).is.true();
      assert.that(aggregateEvents[2].metadata.published).is.false();
    });
  });

  suite('getSnapshot', () => {
    test('returns undefined for an aggregate without a snapshot.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const snapshot = await eventstore.getSnapshot(uuid());

      assert.that(snapshot).is.undefined();
    });

    test('returns a snapshot for the given aggregate.', async () => {
      const aggregateId = uuid();

      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveSnapshot({ aggregateId, revision: 5, state });

      const snapshot = await eventstore.getSnapshot(aggregateId);

      assert.that(snapshot).is.equalTo({
        revision: 5,
        state
      });
    });

    test('correctly handles null, undefined and empty arrays.', async () => {
      const aggregateId = uuid();

      const state = {
        initiator: null,
        destination: undefined,
        participants: []
      };

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveSnapshot({ aggregateId, revision: 5, state });

      const snapshot = await eventstore.getSnapshot(aggregateId);

      assert.that(snapshot.revision).is.equalTo(5);
      assert.that(snapshot.state).is.equalTo({
        initiator: null,
        participants: []
      });
    });

    test('returns the newest snapshot for the given aggregate.', async () => {
      const aggregateId = uuid();

      const stateOld = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      const stateNew = {
        initiator: 'Jane Doe',
        destination: 'Moulou',
        participants: [ 'Jane Doe', 'Jenny Doe' ]
      };

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveSnapshot({ aggregateId, revision: 5, state: stateOld });
      await eventstore.saveSnapshot({ aggregateId, revision: 10, state: stateNew });

      const snapshot = await eventstore.getSnapshot(aggregateId);

      assert.that(snapshot).is.equalTo({
        revision: 10,
        state: stateNew
      });
    });
  });

  suite('saveSnapshot', () => {
    test('saves a snapshot.', async () => {
      const aggregateId = uuid();
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveSnapshot({ aggregateId, revision: 10, state });

      const snapshot = await eventstore.getSnapshot(aggregateId);

      assert.that(snapshot).is.equalTo({
        revision: 10,
        state
      });
    });

    test('saves multiple snapshots.', async () => {
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      const aggregateIds = [ uuid(), uuid(), uuid() ];

      await eventstore.initialize({ ...getOptions(), namespace });

      for (const aggregateId of aggregateIds) {
        await eventstore.saveSnapshot({ aggregateId, revision: 10, state });
      }

      for (const aggregateId of aggregateIds) {
        const snapshot = await eventstore.getSnapshot(aggregateId);

        assert.that(snapshot).is.equalTo({
          revision: 10,
          state
        });
      }
    });

    test('correctly handles null, undefined and empty arrays.', async () => {
      const aggregateId = uuid();
      const state = {
        initiator: null,
        destination: undefined,
        participants: []
      };

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveSnapshot({ aggregateId, revision: 10, state });

      const snapshot = await eventstore.getSnapshot(aggregateId);

      assert.that(snapshot).is.equalTo({
        revision: 10,
        state: {
          initiator: null,
          participants: []
        }
      });
    });

    test('does not throw an error if trying to save an already saved snapshot.', async () => {
      const aggregateId = uuid();
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveSnapshot({ aggregateId, revision: 10, state });
      await eventstore.saveSnapshot({ aggregateId, revision: 10, state });
    });
  });

  suite('getReplay', () => {
    test('returns an empty stream.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const replayStream = await eventstore.getReplay();
      const replayEvents = await toArray(replayStream);

      assert.that(replayEvents.length).is.equalTo(0);
    });

    suite('with existent data', () => {
      setup(async () => {
        const eventStarted = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        const eventJoinedFirst = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        const eventJoinedSecond = new Event({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
          name: 'joined',
          data: { participant: 'Jennifer Doe' },
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        eventStarted.metadata.revision = 1;
        eventJoinedFirst.metadata.revision = 2;
        eventJoinedSecond.metadata.revision = 3;

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({
          uncommittedEvents: [
            { event: eventStarted, state: {}},
            { event: eventJoinedFirst, state: {}},
            { event: eventJoinedSecond, state: {}}
          ]
        });
      });

      test('returns all events if no options are given.', async () => {
        const replayStream = await eventstore.getReplay();
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(3);
        assert.that(replayEvents[0].name).is.equalTo('started');
        assert.that(replayEvents[0].metadata.position).is.equalTo(1);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.position).is.equalTo(2);
        assert.that(replayEvents[2].name).is.equalTo('joined');
        assert.that(replayEvents[2].metadata.position).is.equalTo(3);
      });

      test('returns all events from the given position.', async () => {
        const replayStream = await eventstore.getReplay({ fromPosition: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(2);
        assert.that(replayEvents[0].name).is.equalTo('joined');
        assert.that(replayEvents[0].metadata.position).is.equalTo(2);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.position).is.equalTo(3);
      });

      test('returns all events to the given position.', async () => {
        const replayStream = await eventstore.getReplay({ toPosition: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(2);
        assert.that(replayEvents[0].name).is.equalTo('started');
        assert.that(replayEvents[0].metadata.position).is.equalTo(1);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.position).is.equalTo(2);
      });

      test('returns all events between the given positions.', async () => {
        const replayStream = await eventstore.getReplay({ fromPosition: 2, toPosition: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(1);
        assert.that(replayEvents[0].name).is.equalTo('joined');
        assert.that(replayEvents[0].metadata.position).is.equalTo(2);
      });
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
