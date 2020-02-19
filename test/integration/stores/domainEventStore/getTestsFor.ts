import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { CustomError } from 'defekt';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getShortId } from '../../../shared/getShortId';
import { toArray } from 'streamtoarray';
import { uuid } from 'uuidv4';

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ createDomainEventStore, teardownDomainEventStore }: {
  createDomainEventStore ({ suffix }: {
    suffix: string;
  }): Promise<DomainEventStore>;
  teardownDomainEventStore? ({ suffix }: {
    suffix: string;
  }): Promise<void>;
}): void {
  let domainEventStore: DomainEventStore,
      suffix: string;

  suite('getLastDomainEvent', function (): void {
    this.timeout(20_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
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

      await domainEventStore.storeDomainEvents<DomainEventData>({
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

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEventJoined ]});

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

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted ]
      });

      const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

      assert.that(domainEvent!.metadata.tags).is.equalTo([ 'gdpr' ]);
    });
  });

  suite('getDomainEventsByCausationId', function (): void {
    this.timeout(20_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
    });

    test('stream ends immediately if no events with a matching causation id exist.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

      const domainEventsByCausationId = await toArray(await domainEventStore.getDomainEventsByCausationId({ causationId: uuid() }));

      assert.that(domainEventsByCausationId).is.equalTo([]);
    });

    test('returns all domain events with a matching causation id.', async (): Promise<void> => {
      const causationId = uuid();

      const domainEvent1 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId,
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const domainEvent2 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId,
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const domainEvent3 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent1, domainEvent2, domainEvent3 ]});

      const domainEventsByCausationId = await toArray(await domainEventStore.getDomainEventsByCausationId({ causationId }));

      assert.that(domainEventsByCausationId.length).is.equalTo(2);
      assert.that(domainEventsByCausationId[0].id).is.equalTo(domainEvent1.id);
      assert.that(domainEventsByCausationId[1].id).is.equalTo(domainEvent2.id);
    });
  });

  suite('hasDomainEventsWithCausationId', function (): void {
    this.timeout(20_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
    });

    test('returns false if no events with a matching causation id exist.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

      const hasDomainEventsWithCausationId = await domainEventStore.hasDomainEventsWithCausationId({ causationId: uuid() });

      assert.that(hasDomainEventsWithCausationId).is.equalTo(false);
    });

    test('returns true if events with a matching causation id exist.', async (): Promise<void> => {
      const causationId = uuid();

      const domainEvent1 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId,
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const domainEvent2 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId,
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const domainEvent3 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent1, domainEvent2, domainEvent3 ]});

      const hasDomainEventsWithCausationId = await domainEventStore.hasDomainEventsWithCausationId({ causationId });

      assert.that(hasDomainEventsWithCausationId).is.equalTo(true);
    });
  });

  suite('getDomainEventsByCorrelationId', function (): void {
    this.timeout(20_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
    });

    test('returns an empty array if no events with a matching correlation id exist.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

      const domainEventsByCorrelationId = await toArray(await domainEventStore.getDomainEventsByCorrelationId({ correlationId: uuid() }));

      assert.that(domainEventsByCorrelationId).is.equalTo([]);
    });

    test('returns all domain events with a matching correlation id.', async (): Promise<void> => {
      const correlationId = uuid();

      const domainEvent1 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId,
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const domainEvent2 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId,
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const domainEvent3 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent1, domainEvent2, domainEvent3 ]});

      const domainEventsByCorrelationId = await toArray(await domainEventStore.getDomainEventsByCorrelationId({ correlationId }));

      assert.that(domainEventsByCorrelationId.length).is.equalTo(2);
      assert.that(domainEventsByCorrelationId[0].id).is.equalTo(domainEvent1.id);
      assert.that(domainEventsByCorrelationId[1].id).is.equalTo(domainEvent2.id);
    });
  });

  suite('getReplayForAggregate', function (): void {
    this.timeout(5_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
    });

    test('returns an empty stream for a non-existent aggregate.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });
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

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });
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

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
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

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
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

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted ]
      });

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id
      });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents[0].metadata.tags).is.equalTo([ 'gdpr' ]);
    });

    test('throws an error if the parameter fromRevision is less than 1.', async (): Promise<void> => {
      await assert.that(
        async (): Promise<any> => await domainEventStore.getReplayForAggregate({ aggregateId: uuid(), fromRevision: 0 })
      ).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'fromRevision' must be at least 1.`
      );
    });

    test('throws an error if the parameter toRevision is less than 1.', async (): Promise<void> => {
      await assert.that(
        async (): Promise<any> => await domainEventStore.getReplayForAggregate({ aggregateId: uuid(), toRevision: 0 })
      ).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'toRevision' must be at least 1.`
      );
    });

    test(`throws an error if the parameter 'fromRevision' is greater than 'toRevision'.`, async (): Promise<void> => {
      await assert.that(
        async (): Promise<any> => await domainEventStore.getReplayForAggregate({ aggregateId: uuid(), fromRevision: 5, toRevision: 3 })
      ).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'toRevision' must be greater or equal to 'fromRevision'.`
      );
    });
  });

  suite('storeDomainEvents', function (): void {
    this.timeout(5_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
    });

    test('throws an error if domain events is an empty array.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await domainEventStore.storeDomainEvents({ domainEvents: []});
      }).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === 'Domain events are missing.'
      );
    });

    test('stores domain events.', async (): Promise<void> => {
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

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id
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

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

      await assert.that(async (): Promise<void> => {
        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});
      }).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EREVISIONALREADYEXISTS' && ex.message === 'Aggregate id and revision already exist.'
      );
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

      const storedDomainEvents = await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [ domainEventStarted, domainEventJoined ]
      });

      assert.that(storedDomainEvents.length).is.equalTo(2);
      assert.that(storedDomainEvents[0].name).is.equalTo('started');
      assert.that(storedDomainEvents[0].metadata.revision.global).is.equalTo(1);
      assert.that(storedDomainEvents[1].name).is.equalTo('joined');
      assert.that(storedDomainEvents[1].metadata.revision.global).is.equalTo(2);
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

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

      const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });
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

      await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id
      });
      const aggregateDomainEvents = await toArray(domainEventStream);

      assert.that(aggregateDomainEvents.length).is.equalTo(1);
      assert.that(aggregateDomainEvents[0].metadata.tags).is.equalTo([ 'gdpr' ]);
    });

    suite('replay for aggregate order', function (): void {
      this.timeout(5_000);

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

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

        const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });
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

        await domainEventStore.storeDomainEvents<DomainEventData>({
          domainEvents: [ domainEventStarted, domainEventJoined ]
        });

        const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });
        const aggregateDomainEvents = await toArray(domainEventStream);

        assert.that(aggregateDomainEvents.length).is.equalTo(2);
        assert.that(aggregateDomainEvents[0].metadata.revision.global).is.equalTo(1);
        assert.that(aggregateDomainEvents[1].metadata.revision.global).is.equalTo(2);
      });

      test('assigns increasing global revisions even when storing the domain events individually.', async (): Promise<void> => {
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

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEventStarted ]});
        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEventJoined ]});

        const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });
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

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEventStarted1 ]});
        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEventStarted2 ]});

        const domainEventStream1 = await domainEventStore.getReplayForAggregate({ aggregateId: domainEventStarted1.aggregateIdentifier.id });
        const aggregateDomainEvents1 = await toArray(domainEventStream1);

        assert.that(aggregateDomainEvents1.length).is.equalTo(1);
        assert.that(aggregateDomainEvents1[0].metadata.revision.global).is.equalTo(1);

        const domainEventStream2 = await domainEventStore.getReplayForAggregate({ aggregateId: domainEventStarted2.aggregateIdentifier.id });
        const aggregateDomainEvents2 = await toArray(domainEventStream2);

        assert.that(aggregateDomainEvents2.length).is.equalTo(1);
        assert.that(aggregateDomainEvents2[0].metadata.revision.global).is.equalTo(2);
      });

      test('returns the stored domain events enriched by their global revisions.', async (): Promise<void> => {
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

        const storedDomainEvents = await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

        assert.that(storedDomainEvents.length).is.equalTo(1);
        assert.that(storedDomainEvents[0].metadata.revision.global).is.equalTo(1);
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

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

        assert.that(domainEvent.metadata.revision.global).is.null();
      });
    });
  });

  suite('getSnapshot', function (): void {
    this.timeout(5_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
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

      await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state }});

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

      await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state }});

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

      await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state: stateOld }});
      await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state: stateNew }});

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.equalTo({
        aggregateIdentifier,
        revision: 10,
        state: stateNew
      });
    });
  });

  suite('storeSnapshot', function (): void {
    this.timeout(5_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
    });

    test('stores a snapshot.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };

      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

      assert.that(snapshot).is.equalTo({
        aggregateIdentifier,
        revision: 10,
        state
      });
    });

    test('stores multiple snapshots.', async (): Promise<void> => {
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
        await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
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

      await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});

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

    test('does not throw an error if trying to store an already stored snapshot.', async (): Promise<void> => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup'
      };
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: [ 'Jane Doe' ]
      };

      await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
      await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state }});
    });
  });

  suite('getReplay', function (): void {
    this.timeout(5_000);

    setup(async (): Promise<void> => {
      suffix = getShortId();
      domainEventStore = await createDomainEventStore({ suffix });
    });

    teardown(async (): Promise<void> => {
      await domainEventStore.destroy();
      if (teardownDomainEventStore) {
        await teardownDomainEventStore({ suffix });
      }
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

        await domainEventStore.storeDomainEvents<DomainEventData>({
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

    test('throws an error if the parameter fromRevisionGlobal is less than 1.', async (): Promise<void> => {
      await assert.that(
        async (): Promise<any> => await domainEventStore.getReplay({ fromRevisionGlobal: 0 })
      ).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'fromRevisionGlobal' must be at least 1.`
      );
    });

    test('throws an error if the parameter toRevisionGlobal is less than 1.', async (): Promise<void> => {
      await assert.that(
        async (): Promise<any> => await domainEventStore.getReplay({ toRevisionGlobal: 0 })
      ).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'toRevisionGlobal' must be at least 1.`
      );
    });

    test(`throws an error if the parameter 'fromRevisionGlobal' is greater than 'toRevisionGlobal'.`, async (): Promise<void> => {
      await assert.that(
        async (): Promise<any> => await domainEventStore.getReplay({ fromRevisionGlobal: 5, toRevisionGlobal: 3 })
      ).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'toRevisionGlobal' must be greater or equal to 'fromRevisionGlobal'.`
      );
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

export { getTestsFor };
