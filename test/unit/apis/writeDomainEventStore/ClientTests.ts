import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from 'express';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { Client } from '../../../../lib/apis/writeDomainEventStore/http/v2/Client';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { CustomError } from 'defekt';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../lib/common/errors';
import { getApi } from '../../../../lib/apis/writeDomainEventStore/http';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Snapshot } from '../../../../lib/stores/domainEventStore/Snapshot';
import { v4 } from 'uuid';

suite('writeDomainEventStore/http/Client', (): void => {
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

    suite('storeDomainEvents', (): void => {
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

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await client.storeDomainEvents({
          domainEvents: [
            firstDomainEvent,
            secondDomainEvent
          ]
        });

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

      test('throws a domain events missing error if the given array is empty.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(
          async (): Promise<any> => client.storeDomainEvents({ domainEvents: []})
        ).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ParameterInvalid.code && ex.message === 'Domain events are missing.'
        );
      });
    });

    suite('storeSnapshot', (): void => {
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

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await client.storeSnapshot({ snapshot });

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

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await client.storeSnapshot({ snapshot: firstSnapshot });
        await client.storeSnapshot({ snapshot: secondSnapshot });

        assert.that(await domainEventStore.getSnapshot({ aggregateIdentifier })).is.equalTo(secondSnapshot);
      });
    });
  });
});
