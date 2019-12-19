import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from 'express';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { createDomainEventStore } from 'lib/stores/domainEventStore/createDomainEventStore';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getApi } from '../../../../lib/apis/queryDomainEventStore/http';
import { InMemoryPublisher } from '../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher';
import { InMemorySubscriber } from '../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Snapshot } from '../../../../lib/stores/domainEventStore/Snapshot';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { uuid } from 'uuidv4';

suite('queryDomainEventStore/http', (): void => {
  suite('/v2', (): void => {
    let api: Application,
        domainEventStore: DomainEventStore,
        newDomainEventPublisher: Publisher<object>,
        newDomainEventSubscriber: Subscriber<object>,
        newDomainEventSubscriberChannel: string;

    setup(async (): Promise<void> => {
      domainEventStore = await createDomainEventStore({
        type: 'InMemory',
        options: {}
      });

      newDomainEventSubscriber = await InMemorySubscriber.create();
      newDomainEventSubscriberChannel = uuid();
      newDomainEventPublisher = await InMemoryPublisher.create();

      ({ api } = await getApi({
        corsOrigin: '*',
        domainEventStore,
        newDomainEventSubscriber,
        newDomainEventSubscriberChannel
      }));
    });

    suite('GET /last-domain-event', (): void => {
      test('retrieves the last domain event for a given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const domainEvent = buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1, global: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo(domainEvent);
      });

      test('retrieves the latest domain event if multiple were stored.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const firstDomainEvent = buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1, global: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const secondDomainEvent = buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 2, global: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent ]});

        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo(secondDomainEvent);
      });

      test('returns 400 if the aggregate identifier is malformed.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/last-domain-event?aggregateIdentifier={}',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo('Missing required property: name (at aggregateIdentifier.name).');
      });

      test('returns 404 if no domain events exist for the given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const client = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: `/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(404);
      });
    });

    suite('GET /snapshot', (): void => {
      test('retrieves the snapshot for a given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const snapshot: Snapshot<object> = {
          aggregateIdentifier,
          revision: 1,
          state: {}
        };

        await domainEventStore.storeSnapshot({
          snapshot
        });

        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo(snapshot);
      });

      test('retrieves the latest snapshot if multiple were stored.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const firstSnapshot: Snapshot<object> = {
          aggregateIdentifier,
          revision: 1,
          state: {}
        };
        const secondSnapshot: Snapshot<object> = {
          aggregateIdentifier,
          revision: 2,
          state: {}
        };

        await domainEventStore.storeSnapshot({
          snapshot: firstSnapshot
        });
        await domainEventStore.storeSnapshot({
          snapshot: secondSnapshot
        });

        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo(secondSnapshot);
      });

      test('returns 400 if the aggregate identifier is malformed.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/snapshot?aggregateIdentifier={}',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo('Missing required property: name (at aggregateIdentifier.name).');
      });

      test('returns 404 if no snapshot exists for the given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const client = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: `/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(404);
      });
    });
  });
});
