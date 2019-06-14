'use strict';

const assert = require('assertthat'),
      toArray = require('streamtoarray'),
      uuid = require('uuidv4');

const { EventExternal, EventInternal } = require('../../../../common/elements');

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

  suite('initialize', function () {
    this.timeout(5 * 1000);

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
  });

  suite('getLastEvent', function () {
    this.timeout(5 * 1000);

    test('returns undefined for an aggregate without events.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const aggregateId = uuid();
      const event = await eventstore.getLastEvent({ aggregateId });

      assert.that(event).is.undefined();
    });

    test('returns the last event for the given aggregate.', async () => {
      const aggregateId = uuid();

      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: aggregateId },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const event = await eventstore.getLastEvent({ aggregateId });

      assert.that(event.name).is.equalTo('joined');
      assert.that(event.metadata.revision.aggregate).is.equalTo(2);
    });

    test('correctly handles null, undefined and empty arrays.', async () => {
      const aggregateId = uuid();

      const eventJoined = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: aggregateId },
        name: 'joined',
        data: {
          initiator: null,
          destination: undefined,
          participants: []
        },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({ uncommittedEvents: [ eventJoined ]});

      const event = await eventstore.getLastEvent({ aggregateId });

      assert.that(event.data.initiator).is.null();
      assert.that(event.data.participants).is.equalTo([]);
    });
  });

  suite('getEventStream', function () {
    this.timeout(5 * 1000);

    test('returns an empty stream for a non-existent aggregate.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const eventStream = await eventstore.getEventStream({ aggregateId: uuid() });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(0);
    });

    test('returns a stream of events for the given aggregate.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(2);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
      assert.that(aggregateEvents[1].name).is.equalTo('joined');
    });

    test('returns a stream from revision.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getEventStream({
        aggregateId: eventStarted.aggregate.id,
        fromRevision: 2
      });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].name).is.equalTo('joined');
    });

    test('returns a stream to revision.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getEventStream({
        aggregateId: eventStarted.aggregate.id,
        toRevision: 1
      });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
    });
  });

  suite('getUnpublishedEventStream', function () {
    this.timeout(5 * 1000);

    test('returns an empty stream if there are no unpublished events.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const eventStream = await eventstore.getUnpublishedEventStream();
      const unpublishedEvents = await toArray(eventStream);

      assert.that(unpublishedEvents.length).is.equalTo(0);
    });

    test('returns a stream of unpublished events.', async () => {
      let eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      eventStarted = eventStarted.markAsPublished();

      const eventJoined = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getUnpublishedEventStream();
      const unpublishedEvents = await toArray(eventStream);

      assert.that(unpublishedEvents.length).is.equalTo(1);
      assert.that(unpublishedEvents[0].name).is.equalTo('joined');
    });
  });

  suite('saveEvents', function () {
    this.timeout(5 * 1000);

    test('throws an error if events is an empty array.', async () => {
      await assert.that(async () => {
        await eventstore.saveEvents({ uncommittedEvents: []});
      }).is.throwingAsync('Uncommitted events are missing.');
    });

    test('throws an error if event is not internal.', async () => {
      const eventExternal = EventExternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await eventstore.initialize({ ...getOptions(), namespace });

      await assert.that(async () => {
        await eventstore.saveEvents({ uncommittedEvents: [ eventExternal ]});
      }).is.throwingAsync('Event must be internal.');
    });

    test('saves events.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getEventStream({
        aggregateId: eventStarted.aggregate.id
      });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(2);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
      assert.that(aggregateEvents[1].name).is.equalTo('joined');
    });

    test('does not save annotations.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { foo: 'bar' }, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted ]
      });

      const eventStream = await eventstore.getEventStream({
        aggregateId: eventStarted.aggregate.id
      });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].annotations).is.undefined();
    });

    test('does not remove annotations from committed events.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { foo: 'bar' }, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });

      const [ committedEvent ] = await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted ]
      });

      assert.that(committedEvent.annotations).is.equalTo({ state: { foo: 'bar' }, previousState: {}});
    });

    test('throws an error if the aggregate id and revision of the new event are already in use.', async () => {
      const event = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({ uncommittedEvents: [ event ]});

      await assert.that(async () => {
        await eventstore.saveEvents({ uncommittedEvents: [ event ]});
      }).is.throwingAsync('Aggregate id and revision already exist.');
    });

    test('returns events with updated global revisions.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      const savedEvents = await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      assert.that(savedEvents.length).is.equalTo(2);
      assert.that(savedEvents[0].name).is.equalTo('started');
      assert.that(savedEvents[0].metadata.revision.global).is.equalTo(1);
      assert.that(savedEvents[1].name).is.equalTo('joined');
      assert.that(savedEvents[1].metadata.revision.global).is.equalTo(2);
    });

    test('correctly handles undefined and null.', async () => {
      const event = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: null, destination: undefined },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({ uncommittedEvents: [ event ]});

      const eventStream = await eventstore.getEventStream({ aggregateId: event.aggregate.id });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].data).is.equalTo({ initiator: null });
    });

    test('saves a snapshot when one of the events has a revision divisible by 100.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 99 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: []}, previousState: {}}
      });

      const eventJoinedFirst = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 100 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}, previousState: {}}
      });

      const eventJoinedSecond = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'John Doe' },
        metadata: {
          revision: { aggregate: 101 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe', 'John Doe' ]}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoinedFirst, eventJoinedSecond ]
      });

      const snapshot = await eventstore.getSnapshot({ aggregateId: eventStarted.aggregate.id });

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
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 102 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: []}, previousState: {}}
      });

      const eventJoinedFirst = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 103 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}, previousState: {}}
      });

      const eventJoinedSecond = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'John Doe' },
        metadata: {
          revision: { aggregate: 104 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe', 'John Doe' ]}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoinedFirst, eventJoinedSecond ]
      });

      const snapshot = await eventstore.getSnapshot({ aggregateId: eventStarted.aggregate.id });

      assert.that(snapshot).is.undefined();
    });

    suite('event stream order', function () {
      this.timeout(5 * 1000);

      test('assigns the global revision 1 to the first event.', async () => {
        const event = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({ uncommittedEvents: [ event ]});

        const eventStream = await eventstore.getEventStream({ aggregateId: event.aggregate.id });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(1);
        assert.that(aggregateEvents[0].metadata.revision.global).is.equalTo(1);
      });

      test('assigns increasing global revisions to subsequent events.', async () => {
        const eventStarted = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventJoined = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({
          uncommittedEvents: [ eventStarted, eventJoined ]
        });

        const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(2);
        assert.that(aggregateEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(aggregateEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('assigns increasing global revisions even when saving the events individually.', async () => {
        const eventStarted = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventJoined = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({ uncommittedEvents: [ eventStarted ]});
        await eventstore.saveEvents({ uncommittedEvents: [ eventJoined ]});

        const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(2);
        assert.that(aggregateEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(aggregateEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('ensures that global revisions are unique across aggregates.', async () => {
        const eventStarted1 = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventStarted2 = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({ uncommittedEvents: [ eventStarted1 ]});
        await eventstore.saveEvents({ uncommittedEvents: [ eventStarted2 ]});

        const eventStream1 = await eventstore.getEventStream({ aggregateId: eventStarted1.aggregate.id });
        const aggregateEvents1 = await toArray(eventStream1);

        assert.that(aggregateEvents1.length).is.equalTo(1);
        assert.that(aggregateEvents1[0].metadata.revision.global).is.equalTo(1);

        const eventStream2 = await eventstore.getEventStream({ aggregateId: eventStarted2.aggregate.id });
        const aggregateEvents2 = await toArray(eventStream2);

        assert.that(aggregateEvents2.length).is.equalTo(1);
        assert.that(aggregateEvents2[0].metadata.revision.global).is.equalTo(2);
      });

      test('returns the saved events enriched by their global revisions.', async () => {
        const event = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.initialize({ ...getOptions(), namespace });
        const savedEvents = await eventstore.saveEvents({ uncommittedEvents: [ event ]});

        assert.that(savedEvents.length).is.equalTo(1);
        assert.that(savedEvents[0].metadata.revision.global).is.equalTo(1);
      });

      test('does not change the events that were given as arguments.', async () => {
        const event = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({ uncommittedEvents: [ event ]});

        assert.that(event.metadata.revision.global).is.null();
      });
    });
  });

  suite('markEventsAsPublished', function () {
    this.timeout(5 * 1000);

    test('marks the specified events as published.', async () => {
      const eventStarted = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: uuid() },
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoinedFirst = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoinedSecond = EventInternal.create({
        context: { name: 'planning' },
        aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
        name: 'joined',
        data: { participant: 'Jennifer Doe' },
        metadata: {
          revision: { aggregate: 3 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoinedFirst, eventJoinedSecond ]
      });

      await eventstore.markEventsAsPublished({
        aggregateId: eventStarted.aggregate.id,
        fromRevision: 1,
        toRevision: 2
      });

      const eventStream = await eventstore.getEventStream({ aggregateId: eventStarted.aggregate.id });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents[0].metadata.isPublished).is.true();
      assert.that(aggregateEvents[1].metadata.isPublished).is.true();
      assert.that(aggregateEvents[2].metadata.isPublished).is.false();
    });
  });

  suite('getSnapshot', function () {
    this.timeout(5 * 1000);

    test('returns undefined for an aggregate without a snapshot.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const snapshot = await eventstore.getSnapshot({ aggregateId: uuid() });

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

      const snapshot = await eventstore.getSnapshot({ aggregateId });

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

      const snapshot = await eventstore.getSnapshot({ aggregateId });

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

      const snapshot = await eventstore.getSnapshot({ aggregateId });

      assert.that(snapshot).is.equalTo({
        revision: 10,
        state: stateNew
      });
    });
  });

  suite('saveSnapshot', function () {
    this.timeout(5 * 1000);

    test('saves a snapshot.', async () => {
      const aggregateId = uuid();
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await eventstore.initialize({ ...getOptions(), namespace });
      await eventstore.saveSnapshot({ aggregateId, revision: 10, state });

      const snapshot = await eventstore.getSnapshot({ aggregateId });

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
        const snapshot = await eventstore.getSnapshot({ aggregateId });

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

      const snapshot = await eventstore.getSnapshot({ aggregateId });

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

  suite('getReplay', function () {
    this.timeout(5 * 1000);

    test('returns an empty stream.', async () => {
      await eventstore.initialize({ ...getOptions(), namespace });

      const replayStream = await eventstore.getReplay();
      const replayEvents = await toArray(replayStream);

      assert.that(replayEvents.length).is.equalTo(0);
    });

    suite('with existent data', () => {
      setup(async () => {
        const eventStarted = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: uuid() },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventJoinedFirst = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventJoinedSecond = EventInternal.create({
          context: { name: 'planning' },
          aggregate: { name: 'peerGroup', id: eventStarted.aggregate.id },
          name: 'joined',
          data: { participant: 'Jennifer Doe' },
          metadata: {
            revision: { aggregate: 3 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.initialize({ ...getOptions(), namespace });
        await eventstore.saveEvents({
          uncommittedEvents: [ eventStarted, eventJoinedFirst, eventJoinedSecond ]
        });
      });

      test('returns all events if no options are given.', async () => {
        const replayStream = await eventstore.getReplay();
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(3);
        assert.that(replayEvents[0].name).is.equalTo('started');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(2);
        assert.that(replayEvents[2].name).is.equalTo('joined');
        assert.that(replayEvents[2].metadata.revision.global).is.equalTo(3);
      });

      test('returns all events from the given global revision.', async () => {
        const replayStream = await eventstore.getReplay({ fromRevisionGlobal: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(2);
        assert.that(replayEvents[0].name).is.equalTo('joined');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(2);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(3);
      });

      test('returns all events to the given global revision.', async () => {
        const replayStream = await eventstore.getReplay({ toRevisionGlobal: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(2);
        assert.that(replayEvents[0].name).is.equalTo('started');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('returns all events between the given global revisions.', async () => {
        const replayStream = await eventstore.getReplay({
          fromRevisionGlobal: 2,
          toRevisionGlobal: 2
        });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(1);
        assert.that(replayEvents[0].name).is.equalTo('joined');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(2);
      });
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
