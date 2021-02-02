import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from 'express';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { Client } from '../../../../lib/apis/queryDomainEventStore/http/v2/Client';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { CustomError } from 'defekt';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../lib/common/errors';
import { getApi } from '../../../../lib/apis/queryDomainEventStore/http';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Snapshot } from '../../../../lib/stores/domainEventStore/Snapshot';
import { toArray } from 'streamtoarray';
import { v4 } from 'uuid';

suite('queryDomainEventStore/http/Client', (): void => {
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

    suite('getReplay', (): void => {
      test('returns a stream that ends instantly if there are no domain events to deliver.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getReplay({});

        await new Promise<void>((resolve, reject): void => {
          data.on('data', (): void => {
            reject(new Error('Stream should not have sent data.'));
          });
          data.on('error', reject);
          data.on('end', resolve);
        });
      });

      test('returns a stream that sends all domain events.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const firstDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const secondDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getReplay({});

        await new Promise<void>((resolve, reject): void => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 2) {
              resolve();
            } else {
              reject(new Error('Not all expected messages were received.'));
            }
          });

          data.pipe(asJsonStream(
            [
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo(firstDomainEvent);
                counter += 1;
              },
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo(secondDomainEvent);
                counter += 1;
              }
            ],
            true
          ));
        });
      });

      test('returns a stream that sends all domain events that match the given timestamp constraint.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const firstDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            timestamp: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const secondDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 2,
            timestamp: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const thirdDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 3,
            timestamp: 3,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent, thirdDomainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getReplay({ fromTimestamp: 2 });

        await new Promise<void>((resolve, reject): void => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 1) {
              resolve();
            } else {
              reject(new Error('Not all expected messages were received.'));
            }
          });

          data.pipe(asJsonStream(
            [
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo(secondDomainEvent);
                counter += 1;
              }
            ],
            true
          ));
        });
      });

      test('throws an error if the parameter fromTimestamp is less than 0.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplay({ fromTimestamp: -1 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ParameterInvalid.code && ex.message === `Parameter 'fromTimestamp' must be at least 0.`
        );
      });
    });

    suite('getReplayForAggregate', (): void => {
      test('returns a stream that ends instantly if there are no domain events in the selected aggregate to deliver.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };
        const differentAggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const firstDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getReplayForAggregate({ aggregateId: differentAggregateIdentifier.aggregate.id });

        await new Promise<void>((resolve, reject): void => {
          data.on('data', (stuff: any): void => {
            try {
              assert.that(JSON.parse(stuff.toString())).is.equalTo({ name: 'heartbeat' });
            } catch (ex: unknown) {
              reject(ex);
            }
          });
          data.on('error', reject);
          data.on('end', resolve);
        });
      });

      test('returns a stream that sends all domain events in the selected aggregate.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const firstDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const secondDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });

        await new Promise<void>((resolve, reject): void => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 2) {
              resolve();
            } else {
              reject(new Error('Not all expected messages were received.'));
            }
          });

          data.pipe(asJsonStream(
            [
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo(firstDomainEvent);
                counter += 1;
              },
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo(secondDomainEvent);
                counter += 1;
              }
            ],
            true
          ));
        });
      });

      test('returns a stream that sends all domain events in the selected aggregate that match the given revision constraints.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const firstDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const secondDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const thirdDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 3,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent, thirdDomainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id, fromRevision: 2, toRevision: 2 });

        await new Promise<void>((resolve, reject): void => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 1) {
              resolve();
            } else {
              reject(new Error('Not all expected messages were received.'));
            }
          });

          data.pipe(asJsonStream(
            [
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo(secondDomainEvent);
                counter += 1;
              }
            ],
            true
          ));
        });
      });

      test('closes the stream once the given to-revision-global is reached.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const firstDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const secondDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id, toRevision: 1 });

        await new Promise<void>(async (resolve, reject): Promise<void> => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 1) {
              resolve();
            } else {
              reject(new Error('Did not receive the expected amount of messages.'));
            }
          });

          data.pipe(asJsonStream(
            [
              (): void => {
                counter += 1;
              },
              (): void => {
                reject(new Error('Should not have received more than one event.'));
              }
            ],
            true
          ));
        });
      });

      test('throws an error if the parameter fromRevision is less than 1.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplayForAggregate({ aggregateId: v4(), fromRevision: 0 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ParameterInvalid.code && ex.message === `Parameter 'fromRevision' must be at least 1.`
        );
      });

      test('throws an error if the parameter toRevision is less than 1.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplayForAggregate({ aggregateId: v4(), toRevision: 0 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ParameterInvalid.code && ex.message === `Parameter 'toRevision' must be at least 1.`
        );
      });

      test(`throws an error if the parameter 'fromRevision' is greater than 'toRevision'.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplayForAggregate({ aggregateId: v4(), fromRevision: 5, toRevision: 3 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ParameterInvalid.code && ex.message === `Parameter 'toRevision' must be greater or equal to 'fromRevision'.`
        );
      });
    });

    suite('getLastDomainEvent', (): void => {
      test('retrieves the last domain event for a given aggregate idententifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const domainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getLastDomainEvent({ aggregateIdentifier });

        assert.that(data).is.equalTo(domainEvent);
      });

      test('retrieves the latest domain event if multiple were stored.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const firstDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const secondDomainEvent = buildDomainEvent({
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getLastDomainEvent({ aggregateIdentifier });

        assert.that(data).is.equalTo(secondDomainEvent);
      });

      test('returns undefined if no domain event exists for the given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getLastDomainEvent({ aggregateIdentifier });

        assert.that(data).is.undefined();
      });
    });

    suite('getDomainEventsByCausationId', (): void => {
      test('stream ends immediately if no events with a matching causation id exist.', async (): Promise<void> => {
        const domainEvent = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const domainEventsByCausationId = await toArray(await client.getDomainEventsByCausationId({ causationId: v4() }));

        assert.that(domainEventsByCausationId).is.equalTo([]);
      });

      test('returns all domain events with a matching causation id.', async (): Promise<void> => {
        const causationId = v4();

        const domainEvent1 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId,
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const domainEvent2 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId,
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const domainEvent3 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent1, domainEvent2, domainEvent3 ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const domainEventsByCausationId = await toArray(await client.getDomainEventsByCausationId({ causationId }));

        assert.that(domainEventsByCausationId.length).is.equalTo(2);
        assert.that(domainEventsByCausationId[0].id).is.equalTo(domainEvent1.id);
        assert.that(domainEventsByCausationId[1].id).is.equalTo(domainEvent2.id);
      });
    });

    suite('hasDomainEventsWithCausationId', (): void => {
      test('returns false if no events with a matching causation id exist.', async (): Promise<void> => {
        const domainEvent = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const domainEventsByCausationId = await client.hasDomainEventsWithCausationId({ causationId: v4() });

        assert.that(domainEventsByCausationId).is.false();
      });

      test('returns true if events with a matching causation id exist.', async (): Promise<void> => {
        const causationId = v4();

        const domainEvent1 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId,
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const domainEvent2 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId,
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const domainEvent3 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent1, domainEvent2, domainEvent3 ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const domainEventsByCausationId = await client.hasDomainEventsWithCausationId({ causationId });

        assert.that(domainEventsByCausationId).is.true();
      });
    });

    suite('getDomainEventsByCorrelationId', (): void => {
      test('returns an empty array if no events with a matching correlation id exist.', async (): Promise<void> => {
        const domainEvent = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const domainEventsByCorrelationId = await toArray(await client.getDomainEventsByCorrelationId({ correlationId: v4() }));

        assert.that(domainEventsByCorrelationId).is.equalTo([]);
      });

      test('returns all domain events with a matching correlation id.', async (): Promise<void> => {
        const correlationId = v4();

        const domainEvent1 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId,
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const domainEvent2 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId,
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });
        const domainEvent3 = buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {},
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ domainEvent1, domainEvent2, domainEvent3 ]});

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const domainEventsByCorrelationId = await toArray(await client.getDomainEventsByCorrelationId({ correlationId }));

        assert.that(domainEventsByCorrelationId.length).is.equalTo(2);
        assert.that(domainEventsByCorrelationId[0].id).is.equalTo(domainEvent1.id);
        assert.that(domainEventsByCorrelationId[1].id).is.equalTo(domainEvent2.id);
      });
    });

    suite('getSnapshot', (): void => {
      test('retrieves the snapshot for a given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const snapshot: Snapshot<object> = {
          aggregateIdentifier,
          revision: 1,
          state: {}
        };

        await domainEventStore.storeSnapshot({
          snapshot
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getSnapshot({ aggregateIdentifier });

        assert.that(data).is.equalTo(snapshot);
      });

      test('retrieves the latest snapshot if multiple were stored.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
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

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getSnapshot({ aggregateIdentifier });

        assert.that(data).is.equalTo(secondSnapshot);
      });

      test('returns undefined if no snapshot exists for the given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const data = await client.getSnapshot({ aggregateIdentifier });

        assert.that(data).is.undefined();
      });
    });

    suite('getAggregateIdentifiers', (): void => {
      test('returns an empty stream.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateIdentifierStream = await client.getAggregateIdentifiers();
        const aggregateIdentifiers = await toArray(aggregateIdentifierStream);

        assert.that(aggregateIdentifiers.length).is.equalTo(0);
      });

      test('streams the aggregate identifiers of all aggregates that have domain events in the store.', async (): Promise<void> => {
        const aggregateIdentifierOne = {
          context: {
            name: 'planning'
          },
          aggregate: {
            id: v4(),
            name: 'peerGroup'
          }
        };
        const domainEventStartedOne = buildDomainEvent({
          aggregateIdentifier: aggregateIdentifierOne,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: 1,
            timestamp: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        const aggregateIdentifierTwo = {
          context: {
            name: 'planning'
          },
          aggregate: {
            id: v4(),
            name: 'peerGroup'
          }
        };
        const domainEventStartedTwo = buildDomainEvent({
          aggregateIdentifier: aggregateIdentifierTwo,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: 1,
            timestamp: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        await domainEventStore.storeDomainEvents({
          domainEvents: [ domainEventStartedOne, domainEventStartedTwo ]
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateIdentifierStream = await client.getAggregateIdentifiers();
        const aggregateIdentifiers = await toArray(aggregateIdentifierStream);

        assert.that(aggregateIdentifiers.length).is.equalTo(2);
        assert.that(aggregateIdentifiers).is.equalTo([ aggregateIdentifierOne, aggregateIdentifierTwo ]);
      });

      test('emits each aggregate identifier only once.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'planning'
          },
          aggregate: {
            name: 'peerGroup',
            id: v4()
          }
        };

        const domainEventStarted = buildDomainEvent({
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: 1,
            timestamp: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        const domainEventJoinedFirst = buildDomainEvent({
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: 2,
            timestamp: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        await domainEventStore.storeDomainEvents<DomainEventData>({
          domainEvents: [ domainEventStarted, domainEventJoinedFirst ]
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateIdentifierStream = await client.getAggregateIdentifiers();
        const aggregateIdentifiers = await toArray(aggregateIdentifierStream);

        assert.that(aggregateIdentifiers.length).is.equalTo(1);
        assert.that(aggregateIdentifiers).is.equalTo([ aggregateIdentifier ]);
      });
    });

    suite('getAggregateIdentifiersByName', (): void => {
      test('returns an empty stream.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateIdentifierStream = await client.getAggregateIdentifiersByName({
          contextName: 'planning',
          aggregateName: 'peerGroup'
        });
        const aggregateIdentifiers = await toArray(aggregateIdentifierStream);

        assert.that(aggregateIdentifiers.length).is.equalTo(0);
      });

      test('streams the aggregate identifiers that belong to the given aggregate name and have domain events in the store.', async (): Promise<void> => {
        const aggregateIdentifierOne: AggregateIdentifier = {
          context: {
            name: 'planning'
          },
          aggregate: {
            name: 'peerGroup',
            id: v4()
          }
        };
        const domainEventStartedOne = buildDomainEvent({
          aggregateIdentifier: aggregateIdentifierOne,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: 1,
            timestamp: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        const aggregateIdentifierTwo: AggregateIdentifier = {
          context: {
            name: 'planning'
          },
          aggregate: {
            name: 'peerGroup',
            id: v4()
          }
        };
        const domainEventStartedTwo = buildDomainEvent({
          aggregateIdentifier: aggregateIdentifierTwo,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: 1,
            timestamp: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        const aggregateIdentifierThree: AggregateIdentifier = {
          context: {
            name: 'notPlanning'
          },
          aggregate: {
            name: 'notPeerGroup',
            id: v4()
          }
        };
        const domainEventThree = buildDomainEvent({
          aggregateIdentifier: aggregateIdentifierThree,
          name: 'foo',
          data: {},
          metadata: {
            revision: 1,
            timestamp: 3,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({
          domainEvents: [ domainEventStartedOne, domainEventStartedTwo, domainEventThree ]
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateIdentifierStream = await client.getAggregateIdentifiersByName({
          contextName: 'planning',
          aggregateName: 'peerGroup'
        });
        const aggregateIdentifiers = await toArray(aggregateIdentifierStream);

        assert.that(aggregateIdentifiers.length).is.equalTo(2);
        assert.that(aggregateIdentifiers).is.equalTo([ aggregateIdentifierOne, aggregateIdentifierTwo ]);
      });

      test('emits each aggregate identifier only once.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          context: {
            name: 'planning'
          },
          aggregate: {
            name: 'peerGroup',
            id: v4()
          }
        };

        const domainEventStarted = buildDomainEvent({
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: 1,
            timestamp: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        const domainEventJoinedFirst = buildDomainEvent({
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: 2,
            timestamp: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            tags: [ 'gdpr' ]
          }
        });

        await domainEventStore.storeDomainEvents<DomainEventData>({
          domainEvents: [ domainEventStarted, domainEventJoinedFirst ]
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateIdentifierStream = await client.getAggregateIdentifiersByName({
          contextName: 'planning',
          aggregateName: 'peerGroup'
        });
        const aggregateIdentifiers = await toArray(aggregateIdentifierStream);

        assert.that(aggregateIdentifiers.length).is.equalTo(1);
        assert.that(aggregateIdentifiers).is.equalTo([ aggregateIdentifier ]);
      });
    });
  });
});
