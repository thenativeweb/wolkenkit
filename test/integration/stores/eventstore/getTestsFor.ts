import assert from 'assertthat';
import EventInternal from '../../../../src/common/elements/EventInternal';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import toArray from 'streamtoarray';
import uuid from 'uuidv4';

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ createEventstore }: {
  createEventstore (namespace: string): Promise<Eventstore>;
}): void {
  let eventstore: Eventstore,
      namespace: string;

  suite('getLastEvent', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      namespace = uuid();
      eventstore = await createEventstore(namespace);
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await eventstore.destroy();
    });

    test('returns undefined for an aggregate without events.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'foo'
      };
      const event = await eventstore.getLastEvent({ aggregateIdentifier });

      assert.that(event).is.undefined();
    });

    test('returns the last event for the given aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const event = await eventstore.getLastEvent({ aggregateIdentifier });

      assert.that(event).is.not.undefined();
      assert.that(event!.name).is.equalTo('joined');
      assert.that(event!.metadata.revision.aggregate).is.equalTo(2);
    });

    test('correctly handles null, undefined and empty arrays.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventJoined = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
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

      await eventstore.saveEvents({ uncommittedEvents: [ eventJoined ]});

      const event = await eventstore.getLastEvent({ aggregateIdentifier });

      assert.that(event).is.not.undefined();
      assert.that(event!.data.initiator).is.null();
      assert.that(event!.data.participants).is.equalTo([]);
    });
  });

  suite('getEventStream', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      namespace = uuid();
      eventstore = await createEventstore(namespace);
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await eventstore.destroy();
    });

    test('returns an empty stream for a non-existent aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStream = await eventstore.getEventStream({ aggregateIdentifier });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(0);
    });

    test('returns a stream of events for the given aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getEventStream({ aggregateIdentifier });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(2);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
      assert.that(aggregateEvents[1].name).is.equalTo('joined');
    });

    test('returns a stream from revision.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getEventStream({
        aggregateIdentifier,
        fromRevision: 2
      });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].name).is.equalTo('joined');
    });

    test('returns a stream to revision.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getEventStream({
        aggregateIdentifier,
        toRevision: 1
      });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
    });
  });

  suite('getUnpublishedEventStream', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      namespace = uuid();
      eventstore = await createEventstore(namespace);
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await eventstore.destroy();
    });

    test('returns an empty stream if there are no unpublished events.', async (): Promise<void> => {
      const eventStream = await eventstore.getUnpublishedEventStream();
      const unpublishedEvents = await toArray(eventStream);

      assert.that(unpublishedEvents.length).is.equalTo(0);
    });

    test('returns a stream of unpublished events.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      let eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
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
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getUnpublishedEventStream();
      const unpublishedEvents = await toArray(eventStream);

      assert.that(unpublishedEvents.length).is.equalTo(1);
      assert.that(unpublishedEvents[0].name).is.equalTo('joined');
    });
  });

  suite('saveEvents', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      namespace = uuid();
      eventstore = await createEventstore(namespace);
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await eventstore.destroy();
    });

    test('throws an error if events is an empty array.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await eventstore.saveEvents({ uncommittedEvents: []});
      }).is.throwingAsync('Uncommitted events are missing.');
    });

    test('saves events.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      const eventStream = await eventstore.getEventStream({
        aggregateIdentifier
      });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(2);
      assert.that(aggregateEvents[0].name).is.equalTo('started');
      assert.that(aggregateEvents[1].name).is.equalTo('joined');
    });

    test('does not save annotations.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { foo: 'bar' }, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted ]
      });

      const eventStream = await eventstore.getEventStream({
        aggregateIdentifier
      });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].annotations).is.undefined();
    });

    test('does not remove annotations from committed events.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { foo: 'bar' }, previousState: {}}
      });

      const [ committedEvent ] = await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted ]
      });

      assert.that(committedEvent.annotations).is.equalTo({ state: { foo: 'bar' }, previousState: {}});
    });

    test('throws an error if the aggregate id and revision of the new event are already in use.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const event = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({ uncommittedEvents: [ event ]});

      await assert.that(async (): Promise<void> => {
        await eventstore.saveEvents({ uncommittedEvents: [ event ]});
      }).is.throwingAsync('Aggregate id and revision already exist.');
    });

    test('returns events with updated global revisions.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoined = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const savedEvents = await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoined ]
      });

      assert.that(savedEvents.length).is.equalTo(2);
      assert.that(savedEvents[0].name).is.equalTo('started');
      assert.that(savedEvents[0].metadata.revision.global).is.equalTo(1);
      assert.that(savedEvents[1].name).is.equalTo('joined');
      assert.that(savedEvents[1].metadata.revision.global).is.equalTo(2);
    });

    test('correctly handles undefined and null.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const event = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: null, destination: undefined },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({ uncommittedEvents: [ event ]});

      const eventStream = await eventstore.getEventStream({ aggregateIdentifier });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents.length).is.equalTo(1);
      assert.that(aggregateEvents[0].data).is.equalTo({ initiator: null });
    });

    test('saves a snapshot when one of the events has a revision divisible by 100.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 99 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: []}, previousState: {}}
      });

      const eventJoinedFirst = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 100 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}, previousState: {}}
      });

      const eventJoinedSecond = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'John Doe' },
        metadata: {
          revision: { aggregate: 101 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe', 'John Doe' ]}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoinedFirst, eventJoinedSecond ]
      });

      const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.equalTo({
        aggregateIdentifier,
        revision: 100,
        state: {
          initiator: 'Jane Doe',
          destination: 'Riva',
          participants: [ 'Jane Doe' ]
        }
      });
    });

    test('does not save a snapshot when none of the events has a revision divisible by 100.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 102 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: []}, previousState: {}}
      });

      const eventJoinedFirst = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 103 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}, previousState: {}}
      });

      const eventJoinedSecond = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'John Doe' },
        metadata: {
          revision: { aggregate: 104 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe', 'John Doe' ]}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoinedFirst, eventJoinedSecond ]
      });

      const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.undefined();
    });

    suite('event stream order', function (): void {
      this.timeout(5 * 1000);

      test('assigns the global revision 1 to the first event.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const event = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({ uncommittedEvents: [ event ]});

        const eventStream = await eventstore.getEventStream({ aggregateIdentifier });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(1);
        assert.that(aggregateEvents[0].metadata.revision.global).is.equalTo(1);
      });

      test('assigns increasing global revisions to subsequent events.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const eventStarted = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventJoined = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ eventStarted, eventJoined ]
        });

        const eventStream = await eventstore.getEventStream({ aggregateIdentifier });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(2);
        assert.that(aggregateEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(aggregateEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('assigns increasing global revisions even when saving the events individually.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const eventStarted = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventJoined = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({ uncommittedEvents: [ eventStarted ]});
        await eventstore.saveEvents({ uncommittedEvents: [ eventJoined ]});

        const eventStream = await eventstore.getEventStream({ aggregateIdentifier });
        const aggregateEvents = await toArray(eventStream);

        assert.that(aggregateEvents.length).is.equalTo(2);
        assert.that(aggregateEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(aggregateEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('ensures that global revisions are unique across aggregates.', async (): Promise<void> => {
        const eventStarted1 = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier: {
            id: uuid(),
            name: 'peerGroup'
          },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventStarted2 = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier: {
            id: uuid(),
            name: 'peerGroup'
          },
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({ uncommittedEvents: [ eventStarted1 ]});
        await eventstore.saveEvents({ uncommittedEvents: [ eventStarted2 ]});

        const eventStream1 = await eventstore.getEventStream({ aggregateIdentifier: eventStarted1.aggregateIdentifier });
        const aggregateEvents1 = await toArray(eventStream1);

        assert.that(aggregateEvents1.length).is.equalTo(1);
        assert.that(aggregateEvents1[0].metadata.revision.global).is.equalTo(1);

        const eventStream2 = await eventstore.getEventStream({ aggregateIdentifier: eventStarted2.aggregateIdentifier });
        const aggregateEvents2 = await toArray(eventStream2);

        assert.that(aggregateEvents2.length).is.equalTo(1);
        assert.that(aggregateEvents2[0].metadata.revision.global).is.equalTo(2);
      });

      test('returns the saved events enriched by their global revisions.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const event = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const savedEvents = await eventstore.saveEvents({ uncommittedEvents: [ event ]});

        assert.that(savedEvents.length).is.equalTo(1);
        assert.that(savedEvents[0].metadata.revision.global).is.equalTo(1);
      });

      test('does not change the events that were given as arguments.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const event = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({ uncommittedEvents: [ event ]});

        assert.that(event.metadata.revision.global).is.null();
      });
    });
  });

  suite('markEventsAsPublished', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      namespace = uuid();
      eventstore = await createEventstore(namespace);
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await eventstore.destroy();
    });

    test('marks the specified events as published.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const eventStarted = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoinedFirst = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      const eventJoinedSecond = EventInternal.create({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jennifer Doe' },
        metadata: {
          revision: { aggregate: 3 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ eventStarted, eventJoinedFirst, eventJoinedSecond ]
      });

      await eventstore.markEventsAsPublished({
        aggregateIdentifier,
        fromRevision: 1,
        toRevision: 2
      });

      const eventStream = await eventstore.getEventStream({ aggregateIdentifier });
      const aggregateEvents = await toArray(eventStream);

      assert.that(aggregateEvents[0].metadata.isPublished).is.true();
      assert.that(aggregateEvents[1].metadata.isPublished).is.true();
      assert.that(aggregateEvents[2].metadata.isPublished).is.false();
    });
  });

  suite('getSnapshot', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      namespace = uuid();
      eventstore = await createEventstore(namespace);
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await eventstore.destroy();
    });

    test('returns undefined for an aggregate without a snapshot.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.undefined();
    });

    test('returns a snapshot for the given aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state }});

      const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.equalTo({
        aggregateIdentifier,
        revision: 5,
        state
      });
    });

    test('correctly handles null, undefined and empty arrays.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const state = {
        initiator: null,
        destination: undefined,
        participants: []
      };

      await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state }});

      const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.not.undefined();
      assert.that(snapshot!.aggregateIdentifier).is.equalTo(aggregateIdentifier);
      assert.that(snapshot!.revision).is.equalTo(5);
      assert.that(snapshot!.state).is.equalTo({
        initiator: null,
        participants: []
      });
    });

    test('returns the newest snapshot for the given aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

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

      await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state: stateOld }});
      await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state: stateNew }});

      const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.equalTo({
        aggregateIdentifier,
        revision: 10,
        state: stateNew
      });
    });
  });

  suite('saveSnapshot', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      namespace = uuid();
      eventstore = await createEventstore(namespace);
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await eventstore.destroy();
    });

    test('saves a snapshot.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});

      const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.equalTo({
        aggregateIdentifier,
        revision: 10,
        state
      });
    });

    test('saves multiple snapshots.', async (): Promise<void> => {
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      const aggregateIdentifiers = [
        {
          id: uuid(),
          name: 'foo'
        },
        {
          id: uuid(),
          name: 'bar'
        },
        {
          id: uuid(),
          name: 'baz'
        }
      ];

      for (const aggregateIdentifier of aggregateIdentifiers) {
        await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
      }

      for (const aggregateIdentifier of aggregateIdentifiers) {
        const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

        assert.that(snapshot).is.equalTo({
          aggregateIdentifier,
          revision: 10,
          state
        });
      }
    });

    test('correctly handles null, undefined and empty arrays.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };
      const state = {
        initiator: null,
        destination: undefined,
        participants: []
      };

      await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});

      const snapshot = await eventstore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.equalTo({
        aggregateIdentifier,
        revision: 10,
        state: {
          initiator: null,
          participants: []
        }
      });
    });

    test('does not throw an error if trying to save an already saved snapshot.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
      await eventstore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
    });
  });

  suite('getReplay', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      namespace = uuid();
      eventstore = await createEventstore(namespace);
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await eventstore.destroy();
    });

    test('returns an empty stream.', async (): Promise<void> => {
      const replayStream = await eventstore.getReplay({});
      const replayEvents = await toArray(replayStream);

      assert.that(replayEvents.length).is.equalTo(0);
    });

    suite('with existent data', (): void => {
      setup(async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const eventStarted = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventJoinedFirst = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const eventJoinedSecond = EventInternal.create({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jennifer Doe' },
          metadata: {
            revision: { aggregate: 3 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ eventStarted, eventJoinedFirst, eventJoinedSecond ]
        });
      });

      test('returns all events if no options are given.', async (): Promise<void> => {
        const replayStream = await eventstore.getReplay({});
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(3);
        assert.that(replayEvents[0].name).is.equalTo('started');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(2);
        assert.that(replayEvents[2].name).is.equalTo('joined');
        assert.that(replayEvents[2].metadata.revision.global).is.equalTo(3);
      });

      test('returns all events from the given global revision.', async (): Promise<void> => {
        const replayStream = await eventstore.getReplay({ fromRevisionGlobal: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(2);
        assert.that(replayEvents[0].name).is.equalTo('joined');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(2);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(3);
      });

      test('returns all events to the given global revision.', async (): Promise<void> => {
        const replayStream = await eventstore.getReplay({ toRevisionGlobal: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(2);
        assert.that(replayEvents[0].name).is.equalTo('started');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('returns all events between the given global revisions.', async (): Promise<void> => {
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

export default getTestsFor;
