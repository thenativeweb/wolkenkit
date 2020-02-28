import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from 'express';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { Client } from '../../../../lib/apis/queryDomainEventStore/http/v2/Client';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { CustomError } from 'defekt';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getApi } from '../../../../lib/apis/queryDomainEventStore/http';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Snapshot } from '../../../../lib/stores/domainEventStore/Snapshot';
import { toArray } from 'streamtoarray';
import { uuid } from 'uuidv4';

suite('queryDomainEventStore/http/Client', (): void => {
  suite('/v2', (): void => {
    let api: Application,
        domainEventStore: DomainEventStore;

    setup(async (): Promise<void> => {
      domainEventStore = await createDomainEventStore({
        type: 'InMemory',
        options: {}
      });

      ({ api } = await getApi({
        corsOrigin: '*',
        domainEventStore
      }));
    });

    suite('getReplay', (): void => {
      test('returns a stream that ends instantly if there are no domain events to deliver.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getReplay({});

        await new Promise((resolve, reject): void => {
          data.on('data', (): void => {
            reject(new Error('Stream should not have sent data.'));
          });
          data.on('error', reject);
          data.on('end', resolve);
        });
      });

      test('returns a stream that sends all domain events.', async (): Promise<void> => {
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getReplay({});

        await new Promise((resolve, reject): void => {
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

      test('returns a stream that sends all domain events that match the given revision constraints.', async (): Promise<void> => {
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
        const thirdDomainEvent = buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 3, global: 3 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent, thirdDomainEvent ]});

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getReplay({ fromRevisionGlobal: 2, toRevisionGlobal: 2 });

        await new Promise((resolve, reject): void => {
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
            revision: { aggregate: 1, global: null },
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
            revision: { aggregate: 2, global: null },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent ]});

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getReplay({ toRevisionGlobal: 1 });

        await new Promise(async (resolve, reject): Promise<void> => {
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

      test('throws an error if the parameter fromRevisionGlobal is less than 1.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplay({ fromRevisionGlobal: 0 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'fromRevisionGlobal' must be at least 1.`
        );
      });

      test('throws an error if the parameter toRevisionGlobal is less than 1.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplay({ toRevisionGlobal: 0 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'toRevisionGlobal' must be at least 1.`
        );
      });

      test(`throws an error if the parameter 'fromRevisionGlobal' is greater than 'toRevisionGlobal'.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplay({ fromRevisionGlobal: 5, toRevisionGlobal: 3 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'toRevisionGlobal' must be greater or equal to 'fromRevisionGlobal'.`
        );
      });
    });

    suite('getReplayForAggregate', (): void => {
      test('returns a stream that ends instantly if there are no domain events in the selected aggregate to deliver.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };
        const differentAggregateIdentifier: AggregateIdentifier = {
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

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent ]});

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getReplayForAggregate({ aggregateId: differentAggregateIdentifier.id });

        await new Promise((resolve, reject): void => {
          data.on('data', (stuff: any): void => {
            try {
              assert.that(JSON.parse(stuff.toString())).is.equalTo({ name: 'heartbeat' });
            } catch (ex) {
              reject(ex);
            }
          });
          data.on('error', reject);
          data.on('end', resolve);
        });
      });

      test('returns a stream that sends all domain events in the selected aggregate.', async (): Promise<void> => {
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });

        await new Promise((resolve, reject): void => {
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
        const thirdDomainEvent = buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier,
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 3, global: 3 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent, thirdDomainEvent ]});

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.id, fromRevision: 2, toRevision: 2 });

        await new Promise((resolve, reject): void => {
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
            revision: { aggregate: 1, global: null },
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
            revision: { aggregate: 2, global: null },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await domainEventStore.storeDomainEvents({ domainEvents: [ firstDomainEvent, secondDomainEvent ]});

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.id, toRevision: 1 });

        await new Promise(async (resolve, reject): Promise<void> => {
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
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplayForAggregate({ aggregateId: uuid(), fromRevision: 0 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'fromRevision' must be at least 1.`
        );
      });

      test('throws an error if the parameter toRevision is less than 1.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplayForAggregate({ aggregateId: uuid(), toRevision: 0 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'toRevision' must be at least 1.`
        );
      });

      test(`throws an error if the parameter 'fromRevision' is greater than 'toRevision'.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<any> => await client.getReplayForAggregate({ aggregateId: uuid(), fromRevision: 5, toRevision: 3 })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EPARAMETERINVALID' && ex.message === `Parameter 'toRevision' must be greater or equal to 'fromRevision'.`
        );
      });
    });

    suite('getLastDomainEvent', (): void => {
      test('retrieves the last domain event for a given aggregate idententifier.', async (): Promise<void> => {
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getLastDomainEvent({ aggregateIdentifier });

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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getLastDomainEvent({ aggregateIdentifier });

        assert.that(data).is.equalTo(secondDomainEvent);
      });

      test('returns undefined if no domain event exists for the given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getLastDomainEvent({ aggregateIdentifier });

        assert.that(data).is.undefined();
      });
    });

    suite('getDomainEventsByCausationId', (): void => {
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const domainEventsByCausationId = await toArray(await client.getDomainEventsByCausationId({ causationId: uuid() }));

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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const domainEventsByCausationId = await client.hasDomainEventsWithCausationId({ causationId: uuid() });

        assert.that(domainEventsByCausationId).is.false();
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const domainEventsByCausationId = await client.hasDomainEventsWithCausationId({ causationId });

        assert.that(domainEventsByCausationId).is.true();
      });
    });

    suite('getDomainEventsByCorrelationId', (): void => {
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const domainEventsByCorrelationId = await toArray(await client.getDomainEventsByCorrelationId({ correlationId: uuid() }));

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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getSnapshot({ aggregateIdentifier });

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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getSnapshot({ aggregateIdentifier });

        assert.that(data).is.equalTo(secondSnapshot);
      });

      test('returns undefined if no snapshot exists for the given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getSnapshot({ aggregateIdentifier });

        assert.that(data).is.undefined();
      });
    });
  });
});
