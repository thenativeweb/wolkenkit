import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from 'express';
import { asJsonStream } from 'test/shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { Client } from '../../../../lib/apis/writeDomainEventStore/http/v2/Client';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { CustomError } from 'defekt';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getApi } from '../../../../lib/apis/writeDomainEventStore/http';
import { InMemoryPublisher } from '../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher';
import { InMemorySubscriber } from '../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Snapshot } from '../../../../lib/stores/domainEventStore/Snapshot';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { uuid } from 'uuidv4';
import { waitForSignals } from 'wait-for-signals';

suite('writeDomainEventStore/http/Client', (): void => {
  suite('/v2', (): void => {
    let api: Application,
        domainEventStore: DomainEventStore,
        newDomainEventPublisher: Publisher<DomainEvent<DomainEventData>>,
        newDomainEventPublisherChannel: string,
        newDomainEventSubscriber: Subscriber<DomainEvent<DomainEventData>>;

    setup(async (): Promise<void> => {
      domainEventStore = await createDomainEventStore({
        type: 'InMemory',
        options: {}
      });

      newDomainEventSubscriber = await InMemorySubscriber.create();
      newDomainEventPublisherChannel = uuid();
      newDomainEventPublisher = await InMemoryPublisher.create();

      ({ api } = await getApi({
        corsOrigin: '*',
        domainEventStore,
        newDomainEventPublisher,
        newDomainEventPublisherChannel
      }));
    });

    suite('storeDomainEvents', (): void => {
      test('stores the given domain events and publishes them via the publisher.', async (): Promise<void> => {
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

        let receivedNotificationCount = 0;

        const collector = waitForSignals({ count: 1 });

        await newDomainEventSubscriber.subscribe({
          channel: newDomainEventPublisherChannel,
          async callback (message): Promise<void> {
            if (receivedNotificationCount === 0) {
              assert.that(message).is.equalTo(firstDomainEvent);
            }
            if (receivedNotificationCount === 1) {
              assert.that(message).is.equalTo(secondDomainEvent);
            }

            receivedNotificationCount += 1;

            if (receivedNotificationCount === 2) {
              await collector.signal();
            }
          }
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const events = await client.storeDomainEvents({
          domainEvents: [
            firstDomainEvent,
            secondDomainEvent
          ]
        });

        assert.that(events).is.equalTo([
          firstDomainEvent,
          secondDomainEvent
        ]);

        const domainEventReplay = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });

        await new Promise((resolve): void => {
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

        await collector.promise;
      });

      test('throws a domain events missing error if the given array is empty.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(
          async (): Promise<any> => client.storeDomainEvents({ domainEvents: []})
        ).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === 'Domain events are missing.'
        );
      });
    });

    suite('storeSnapshot', (): void => {
      test('stores the given snapshot.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const snapshot: Snapshot<object> = {
          aggregateIdentifier,
          revision: 1,
          state: {}
        };

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.storeSnapshot({ snapshot });

        assert.that(await domainEventStore.getSnapshot({ aggregateIdentifier })).is.equalTo(snapshot);
      });

      test('overwrites the previous snapshot if one existed.', async (): Promise<void> => {
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.storeSnapshot({ snapshot: firstSnapshot });
        await client.storeSnapshot({ snapshot: secondSnapshot });

        assert.that(await domainEventStore.getSnapshot({ aggregateIdentifier })).is.equalTo(secondSnapshot);
      });
    });
  });
});
