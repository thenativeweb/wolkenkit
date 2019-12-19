import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getShortId } from '../../../shared/getShortId';
import { toArray } from 'streamtoarray';
import { uuid } from 'uuidv4';

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ createDomainEventStore }: {
  createDomainEventStore ({ suffix }: {
    suffix: string;
  }): Promise<DomainEventStore>;
}): void {
  let domainEventStore: DomainEventStore,
      suffix: string;

  suite('getLastDomainEvent', function (): void {
    this.timeout(20 * 1000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await domainEventStore.destroy();
    });

    test('returns undefined for an aggregate without domain events.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'foo'
      };
      const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

      assert.that(domainEvent).is.undefined();
    });

    test('returns the last domain event for the given aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

      assert.that(domainEvent).is.not.undefined();
      assert.that(domainEvent!.name).is.equalTo('joined');
      assert.that(domainEvent!.metadata.revision.aggregate).is.equalTo(2);
    });

    test('correctly handles null, undefined and empty arrays.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventJoined = buildDomainEvent({
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
        }
      });

      await domainEventStore.saveDomainEvents({ domainEvents: [ domainEventJoined ]});

      const domainEvent: DomainEvent<any> | undefined =
        await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

      assert.that(domainEvent).is.not.undefined();
      assert.that(domainEvent!.data.initiator).is.null();
      assert.that(domainEvent!.data.participants).is.equalTo([]);
    });

    test('supports tags.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          tags: [ 'gdpr' ]
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted ]
      });

      const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

      assert.that(domainEvent!.metadata.tags).is.equalTo([ 'gdpr' ]);
    });
  });

  suite('getDomainEventStream', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await domainEventStore.destroy();
    });

    test('returns an empty stream for a non-existent aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStream = await domainEventStore.getDomainEventStream({ aggregateIdentifier });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents.length).is.equalTo(0);
    });

    test('returns a stream of domain events for the given aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getDomainEventStream({ aggregateIdentifier });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents.length).is.equalTo(2);
      assert.that(aggregateDomainEvents[0].name).is.equalTo('started');
      assert.that(aggregateDomainEvents[1].name).is.equalTo('joined');
    });

    test('returns a stream from revision.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getDomainEventStream({
        aggregateIdentifier,
        fromRevision: 2
      });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents.length).is.equalTo(1);
      assert.that(aggregateDomainEvents[0].name).is.equalTo('joined');
    });

    test('returns a stream to revision.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getDomainEventStream({
        aggregateIdentifier,
        toRevision: 1
      });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents.length).is.equalTo(1);
      assert.that(aggregateDomainEvents[0].name).is.equalTo('started');
    });

    test('supports tags.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          tags: [ 'gdpr' ]
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted ]
      });

      const domainEventStream = await domainEventStore.getDomainEventStream({
        aggregateIdentifier
      });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents[0].metadata.tags).is.equalTo([ 'gdpr' ]);
    });
  });

  suite('getUnpublishedDomainEventStream', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await domainEventStore.destroy();
    });

    test('returns an empty stream if there are no unpublished domain events.', async (): Promise<void> => {
      const domainEventStream = await domainEventStore.getUnpublishedDomainEventStream();
      const unpublishedDomainEvents = await toArray(domainEventStream);

      assert.that(unpublishedDomainEvents.length).is.equalTo(0);
    });

    test('returns a stream of unpublished domain events.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      let domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      domainEventStarted = domainEventStarted.asPublished();

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getUnpublishedDomainEventStream();
      const unpublishedDomainEvents = await toArray(domainEventStream);

      assert.that(unpublishedDomainEvents.length).is.equalTo(1);
      assert.that(unpublishedDomainEvents[0].name).is.equalTo('joined');
    });

    test('supports tags.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          tags: [ 'gdpr' ]
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted ]
      });

      const domainEventStream = await domainEventStore.getUnpublishedDomainEventStream();
      const unpublishedDomainEvents = await toArray(domainEventStream);

      assert.that(unpublishedDomainEvents.length).is.equalTo(1);
      assert.that(unpublishedDomainEvents[0].metadata.tags).is.equalTo([ 'gdpr' ]);
    });
  });

  suite('saveDomainEvents', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await domainEventStore.destroy();
    });

    test('throws an error if domain events is an empty array.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await domainEventStore.saveDomainEvents({ domainEvents: []});
      }).is.throwingAsync('Domain events are missing.');
    });

    test('saves domain events.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getDomainEventStream({
        aggregateIdentifier
      });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents.length).is.equalTo(2);
      assert.that(aggregateDomainEvents[0].name).is.equalTo('started');
      assert.that(aggregateDomainEvents[1].name).is.equalTo('joined');
    });

    test('throws an error if the aggregate id and revision of the new domain event are already in use.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents({ domainEvents: [ domainEvent ]});

      await assert.that(async (): Promise<void> => {
        await domainEventStore.saveDomainEvents({ domainEvents: [ domainEvent ]});
      }).is.throwingAsync('Aggregate id and revision already exist.');
    });

    test('returns domain events with updated global revisions.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const savedDomainEvents = await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      assert.that(savedDomainEvents.length).is.equalTo(2);
      assert.that(savedDomainEvents[0].name).is.equalTo('started');
      assert.that(savedDomainEvents[0].metadata.revision.global).is.equalTo(1);
      assert.that(savedDomainEvents[1].name).is.equalTo('joined');
      assert.that(savedDomainEvents[1].metadata.revision.global).is.equalTo(2);
    });

    test('correctly handles undefined and null.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: null, destination: undefined },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents({ domainEvents: [ domainEvent ]});

      const domainEventStream = await domainEventStore.getDomainEventStream({ aggregateIdentifier });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents.length).is.equalTo(1);
      assert.that(aggregateDomainEvents[0].data).is.equalTo({ initiator: null });
    });

    test('supports tags.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          tags: [ 'gdpr' ]
        }
      });

      await domainEventStore.saveDomainEvents({ domainEvents: [ domainEvent ]});

      const domainEventStream = await domainEventStore.getDomainEventStream({ aggregateIdentifier });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents.length).is.equalTo(1);
      assert.that(aggregateDomainEvents[0].metadata.tags).is.equalTo([ 'gdpr' ]);
    });

    suite('domain event stream order', function (): void {
      this.timeout(5 * 1000);

      test('assigns the global revision 1 to the first domain event.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const domainEvent = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.saveDomainEvents({ domainEvents: [ domainEvent ]});

        const domainEventStream = await domainEventStore.getDomainEventStream({ aggregateIdentifier });
        const aggregateDomainEvents = await toArray(domainEventStream);

        assert.that(aggregateDomainEvents.length).is.equalTo(1);
        assert.that(aggregateDomainEvents[0].metadata.revision.global).is.equalTo(1);
      });

      test('assigns increasing global revisions to subsequent domain events.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const domainEventStarted = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        const domainEventJoined = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.saveDomainEvents<DomainEventData>({
          domainEvents: [ domainEventStarted, domainEventJoined ]
        });

        const domainEventStream = await domainEventStore.getDomainEventStream({ aggregateIdentifier });
        const aggregateDomainEvents = await toArray(domainEventStream);

        assert.that(aggregateDomainEvents.length).is.equalTo(2);
        assert.that(aggregateDomainEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(aggregateDomainEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('assigns increasing global revisions even when saving the domain events individually.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const domainEventStarted = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        const domainEventJoined = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.saveDomainEvents({ domainEvents: [ domainEventStarted ]});
        await domainEventStore.saveDomainEvents({ domainEvents: [ domainEventJoined ]});

        const domainEventStream = await domainEventStore.getDomainEventStream({ aggregateIdentifier });
        const aggregateDomainEvents = await toArray(domainEventStream);

        assert.that(aggregateDomainEvents.length).is.equalTo(2);
        assert.that(aggregateDomainEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(aggregateDomainEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('ensures that global revisions are unique across aggregates.', async (): Promise<void> => {
        const domainEventStarted1 = buildDomainEvent({
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
          }
        });

        const domainEventStarted2 = buildDomainEvent({
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
          }
        });

        await domainEventStore.saveDomainEvents({ domainEvents: [ domainEventStarted1 ]});
        await domainEventStore.saveDomainEvents({ domainEvents: [ domainEventStarted2 ]});

        const domainEventStream1 = await domainEventStore.getDomainEventStream({ aggregateIdentifier: domainEventStarted1.aggregateIdentifier });
        const aggregateDomainEvents1 = await toArray(domainEventStream1);

        assert.that(aggregateDomainEvents1.length).is.equalTo(1);
        assert.that(aggregateDomainEvents1[0].metadata.revision.global).is.equalTo(1);

        const domainEventStream2 = await domainEventStore.getDomainEventStream({ aggregateIdentifier: domainEventStarted2.aggregateIdentifier });
        const aggregateDomainEvents2 = await toArray(domainEventStream2);

        assert.that(aggregateDomainEvents2.length).is.equalTo(1);
        assert.that(aggregateDomainEvents2[0].metadata.revision.global).is.equalTo(2);
      });

      test('returns the saved domain events enriched by their global revisions.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const domainEvent = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        const savedDomainEvents = await domainEventStore.saveDomainEvents({ domainEvents: [ domainEvent ]});

        assert.that(savedDomainEvents.length).is.equalTo(1);
        assert.that(savedDomainEvents[0].metadata.revision.global).is.equalTo(1);
      });

      test('does not change the domain events that were given as arguments.', async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const domainEvent = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.saveDomainEvents({ domainEvents: [ domainEvent ]});

        assert.that(domainEvent.metadata.revision.global).is.null();
      });
    });
  });

  suite('markDomainEventsAsPublished', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await domainEventStore.destroy();
    });

    test('marks the specified domain events as published.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const domainEventJoinedFirst = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: { aggregate: 2 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const domainEventJoinedSecond = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jennifer Doe' },
        metadata: {
          revision: { aggregate: 3 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.saveDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoinedFirst, domainEventJoinedSecond ]
      });

      await domainEventStore.markDomainEventsAsPublished({
        aggregateIdentifier,
        fromRevision: 1,
        toRevision: 2
      });

      const domainEventStream = await domainEventStore.getDomainEventStream({ aggregateIdentifier });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents[0].metadata.isPublished).is.true();
      assert.that(aggregateDomainEvents[1].metadata.isPublished).is.true();
      assert.that(aggregateDomainEvents[2].metadata.isPublished).is.false();
    });
  });

  suite('getSnapshot', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await domainEventStore.destroy();
    });

    test('returns undefined for an aggregate without a snapshot.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

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

      await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state }});

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

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

      await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state }});

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

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

      await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state: stateOld }});
      await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state: stateNew }});

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

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
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await domainEventStore.destroy();
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

      await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

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
        await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
      }

      for (const aggregateIdentifier of aggregateIdentifiers) {
        const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

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

      await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

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

      await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
      await domainEventStore.saveSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
    });
  });

  suite('getReplay', function (): void {
    this.timeout(5 * 1000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async function (): Promise<void> {
      this.timeout(20 * 1000);

      await domainEventStore.destroy();
    });

    test('returns an empty stream.', async (): Promise<void> => {
      const replayStream = await domainEventStore.getReplay({});
      const replayEvents = await toArray(replayStream);

      assert.that(replayEvents.length).is.equalTo(0);
    });

    suite('with existent data', (): void => {
      setup(async (): Promise<void> => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup'
        };

        const domainEventStarted = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        const domainEventJoinedFirst = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        const domainEventJoinedSecond = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jennifer Doe' },
          metadata: {
            revision: { aggregate: 3 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        await domainEventStore.saveDomainEvents<DomainEventData>({
          domainEvents: [ domainEventStarted, domainEventJoinedFirst, domainEventJoinedSecond ]
        });
      });

      test('returns all domain events if no options are given.', async (): Promise<void> => {
        const replayStream = await domainEventStore.getReplay({});
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(3);
        assert.that(replayEvents[0].name).is.equalTo('started');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(2);
        assert.that(replayEvents[2].name).is.equalTo('joined');
        assert.that(replayEvents[2].metadata.revision.global).is.equalTo(3);
      });

      test('returns all domain events from the given global revision.', async (): Promise<void> => {
        const replayStream = await domainEventStore.getReplay({ fromRevisionGlobal: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(2);
        assert.that(replayEvents[0].name).is.equalTo('joined');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(2);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(3);
      });

      test('returns all domain events to the given global revision.', async (): Promise<void> => {
        const replayStream = await domainEventStore.getReplay({ toRevisionGlobal: 2 });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(2);
        assert.that(replayEvents[0].name).is.equalTo('started');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(replayEvents[1].name).is.equalTo('joined');
        assert.that(replayEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('returns all domain events between the given global revisions.', async (): Promise<void> => {
        const replayStream = await domainEventStore.getReplay({
          fromRevisionGlobal: 2,
          toRevisionGlobal: 2
        });
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents.length).is.equalTo(1);
        assert.that(replayEvents[0].name).is.equalTo('joined');
        assert.that(replayEvents[0].metadata.revision.global).is.equalTo(2);
      });

      test('supports tags.', async (): Promise<void> => {
        const replayStream = await domainEventStore.getReplay({});
        const replayEvents = await toArray(replayStream);

        assert.that(replayEvents[0].metadata.tags).is.equalTo([ 'gdpr' ]);
        assert.that(replayEvents[1].metadata.tags).is.equalTo([ 'gdpr' ]);
        assert.that(replayEvents[2].metadata.tags).is.equalTo([ 'gdpr' ]);
      });
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

export { getTestsFor };
