import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from 'express';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../lib/common/errors';
import { getApi } from '../../../../lib/apis/writeDomainEventStore/http';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Snapshot } from '../../../../lib/stores/domainEventStore/Snapshot';
import { v4 } from 'uuid';

suite('writeDomainEventStore/http', (): void => {
  suite('/v2', (): void => {
    let api: Application,
        domainEventStore: DomainEventStore;

    setup(async (): Promise<void> => {
      domainEventStore = await createDomainEventStore({
        type: 'InMemory'
      });

      ({ api } = await getApi({
        corsOrigin: '*',
        domainEventStore
      }));
    });

    suite('POST /store-domain-events', (): void => {
      test('stores the given domain events.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: v4()
        };

        const firstDomainEvent = buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
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
            revision: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/store-domain-events',
          data: [ firstDomainEvent, secondDomainEvent ]
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo({});

        const domainEventReplay = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });

        await new Promise<void>((resolve): void => {
          domainEventReplay.pipe(asJsonStream(
            [
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo(firstDomainEvent);
              },
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo(secondDomainEvent);

                resolve();
              }
            ],
            true
          ));
        });
      });

      test('returns 400 if the data is not an array.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/store-domain-events',
          data: {},
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'Request body must be an array of domain events.'
        });
      });

      test('returns 400 if a domain event is malformed.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/store-domain-events',
          data: [{}],
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'Missing required property: contextIdentifier (at requestBody.0.contextIdentifier).'
        });
      });

      test('returns 400 if the data is an empty array.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/store-domain-events',
          data: [],
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.ParameterInvalid.code,
          message: 'Domain events are missing.'
        });
      });

      test('returns 415 if the content type is not application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/store-domain-events',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: errors.ContentTypeMismatch.code,
          message: 'Header content-type must be application/json.'
        });
      });
    });

    suite('POST /store-snapshot', (): void => {
      test('stores the given snapshot.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: v4()
        };

        const snapshot: Snapshot<object> = {
          aggregateIdentifier,
          revision: 1,
          state: {}
        };

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/store-snapshot',
          data: snapshot
        });

        assert.that(status).is.equalTo(200);
        assert.that(await domainEventStore.getSnapshot({ aggregateIdentifier })).is.equalTo(snapshot);
      });

      test('overwrites the previous snapshot if one existed.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: v4()
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

        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/store-snapshot',
          data: firstSnapshot
        });
        await client({
          method: 'post',
          url: '/v2/store-snapshot',
          data: secondSnapshot
        });

        assert.that(await domainEventStore.getSnapshot({ aggregateIdentifier })).is.equalTo(secondSnapshot);
      });

      test('returns 400 if the snapshot is malformed.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/store-snapshot',
          data: {},
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.SnapshotMalformed.code,
          message: 'Missing required property: aggregateIdentifier (at requestBody.aggregateIdentifier).'
        });
      });
    });
  });
});
