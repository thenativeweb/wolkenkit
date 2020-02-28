import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from 'express';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getApi } from '../../../../lib/apis/queryDomainEventStore/http';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Snapshot } from '../../../../lib/stores/domainEventStore/Snapshot';
import { uuid } from 'uuidv4';
import { waitForSignals } from 'wait-for-signals';

suite('queryDomainEventStore/http', (): void => {
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

    suite('GET /replay', (): void => {
      test('returns a stream that sends a heartbeat and then ends instantly if there are no domain events to deliver.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: '/v2/replay',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

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

      test('returns a stream that sends a heartbeat and then all domain events.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: '/v2/replay',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

        await new Promise((resolve, reject): void => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 3) {
              resolve();
            } else {
              reject(new Error('Not all expected messages were received.'));
            }
          });

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              counter += 1;
            },
            (domainEvent): void => {
              assert.that(domainEvent).is.equalTo(firstDomainEvent);
              counter += 1;
            },
            (domainEvent): void => {
              assert.that(domainEvent).is.equalTo(secondDomainEvent);
              counter += 1;
            }
          ]));
        });
      });

      test('returns a stream that sends a heartbeat and then all domain events that match the given revision constraints.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: '/v2/replay?fromRevisionGlobal=2&toRevisionGlobal=2',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

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

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              counter += 1;
            },
            (domainEvent): void => {
              assert.that(domainEvent).is.equalTo(secondDomainEvent);
              counter += 1;
            }
          ]));
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

        const { client } = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: '/v2/replay?toRevisionGlobal=1',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

        await new Promise(async (resolve, reject): Promise<void> => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 2) {
              resolve();
            } else {
              reject(new Error('Did not receive the expected amount of messages.'));
            }
          });

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              counter += 1;
            },
            (): void => {
              counter += 1;
            },
            (): void => {
              reject(new Error('Should not have received more than one event.'));
            }
          ]));
        });
      });

      test('returns 400 if the parameter fromRevisionGlobal is less than 1.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?fromRevisionGlobal=0',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'fromRevisionGlobal' must be at least 1.`);
      });

      test('returns 400 if the parameter fromRevisionGlobal is not a number.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?fromRevisionGlobal=foo',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'fromRevisionGlobal' must be a number.`);
      });

      test('returns 400 if the parameter toRevisionGlobal is less than 1.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?toRevisionGlobal=0',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevisionGlobal' must be at least 1.`);
      });

      test('returns 400 if the parameter toRevisionGlobal is not a number.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?toRevisionGlobal=foo',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevisionGlobal' must be a number.`);
      });

      test(`returns 400 if the parameter 'fromRevisionGlobal' is greater than 'toRevisionGlobal'.`, async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?fromRevisionGlobal=4&toRevisionGlobal=2',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevisionGlobal' must be greater or equal to 'fromRevisionGlobal'.`);
      });
    });

    suite('GET /replay/:aggregateId', (): void => {
      test('returns a stream that sends a heartbeat and then ends instantly if there are no domain events for the selected aggregate to deliver.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/replay/${differentAggregateIdentifier.id}`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

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

      test('returns a stream that sends a heartbeat and then all domain events.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/replay/${aggregateIdentifier.id}`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

        await new Promise((resolve, reject): void => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 3) {
              resolve();
            } else {
              reject(new Error('Not all expected messages were received.'));
            }
          });

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              counter += 1;
            },
            (domainEvent): void => {
              assert.that(domainEvent).is.equalTo(firstDomainEvent);
              counter += 1;
            },
            (domainEvent): void => {
              assert.that(domainEvent).is.equalTo(secondDomainEvent);
              counter += 1;
            }
          ]));
        });
      });

      test('returns a stream that sends a heartbeat and then all domain events that match the given revision constraints.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/replay/${aggregateIdentifier.id}?fromRevision=2&toRevision=2`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

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

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              counter += 1;
            },
            (domainEvent): void => {
              assert.that(domainEvent).is.equalTo(secondDomainEvent);
              counter += 1;
            }
          ]));
        });
      });

      test('closes the stream once the given to-revision-global is reached and does not deliver it.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/replay/${aggregateIdentifier.id}?toRevision=1`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

        await new Promise(async (resolve, reject): Promise<void> => {
          let counter = 0;

          data.on('error', reject);
          data.on('end', (): void => {
            if (counter === 2) {
              resolve();
            } else {
              reject(new Error('Did not receive the expected amount of messages.'));
            }
          });

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              counter += 1;
            },
            (): void => {
              counter += 1;
            },
            (): void => {
              reject(new Error('Should not have received more than one event.'));
            }
          ]));
        });
      });

      test('returns 400 if the parameter fromRevision is less than 1.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?fromRevision=0`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'fromRevision' must be at least 1.`);
      });

      test('returns 400 if the parameter fromRevision is not a number.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?fromRevision=foo`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'fromRevision' must be a number.`);
      });

      test('returns 400 if the parameter toRevision is less than 1.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?toRevision=0`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevision' must be at least 1.`);
      });

      test('returns 400 if the parameter toRevision is not a number.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?toRevision=foo`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevision' must be a number.`);
      });

      test(`returns 400 if the parameter 'fromRevision' is greater than 'toRevision'.`, async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?fromRevision=4&toRevision=2`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
      });
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

        const { client } = await runAsServer({ app: api });

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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo(secondDomainEvent);
      });

      test('returns 400 if the aggregate identifier is malformed.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/last-domain-event?aggregateIdentifier={}',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: 'EAGGREGATEIDENTIFIERMALFORMED',
          message: 'Missing required property: name (at aggregateIdentifier.name).'
        });
      });

      test('returns 404 if no domain events exist for the given aggregate identifier.', async (): Promise<void> => {
        const aggregateIdentifier: AggregateIdentifier = {
          name: 'sampleAggregate',
          id: uuid()
        };

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: `/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(404);
      });
    });

    suite('GET /domain-events-by-causation-id', (): void => {
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

        const { client } = await runAsServer({ app: api });
        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/domain-events-by-causation-id?causation-id=${uuid()}`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

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

        const { client } = await runAsServer({ app: api });
        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/domain-events-by-causation-id?causation-id=${causationId}`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

        const collector = waitForSignals({ count: 4 });

        data.on('error', async (ex: Error): Promise<void> => {
          await collector.fail(ex);
        });
        data.on('end', async (): Promise<void> => {
          await collector.signal();
        });

        data.pipe(asJsonStream([
          async (heartbeat): Promise<void> => {
            try {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              await collector.signal();
            } catch (ex) {
              await collector.fail(ex);
            }
          },
          async (domainEvent): Promise<void> => {
            try {
              assert.that(domainEvent).is.atLeast({ id: domainEvent1.id });
              await collector.signal();
            } catch (ex) {
              await collector.fail(ex);
            }
          },
          async (domainEvent): Promise<void> => {
            try {
              assert.that(domainEvent).is.atLeast({ id: domainEvent2.id });
              await collector.signal();
            } catch (ex) {
              await collector.fail(ex);
            }
          }
        ]));

        await collector.promise;
      });
    });

    suite('GET /has-domain-events-with-causation-id', (): void => {
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

        const { client } = await runAsServer({ app: api });
        const { status, data } = await client({
          method: 'get',
          url: `/v2/has-domain-events-with-causation-id?causation-id=${uuid()}`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo({ hasDomainEventsWithCausationId: false });
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

        const { client } = await runAsServer({ app: api });
        const { status, data } = await client({
          method: 'get',
          url: `/v2/has-domain-events-with-causation-id?causation-id=${causationId}`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo({ hasDomainEventsWithCausationId: true });
      });
    });

    suite('GET /domain-events-by-correlation-id', (): void => {
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

        const { client } = await runAsServer({ app: api });
        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/domain-events-by-correlation-id?correlation-id=${uuid()}`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

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

        const { client } = await runAsServer({ app: api });
        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/domain-events-by-correlation-id?correlation-id=${correlationId}`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

        const collector = waitForSignals({ count: 4 });

        data.on('error', async (ex: Error): Promise<void> => {
          await collector.fail(ex);
        });
        data.on('end', async (): Promise<void> => {
          await collector.signal();
        });

        data.pipe(asJsonStream([
          async (heartbeat): Promise<void> => {
            try {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              await collector.signal();
            } catch (ex) {
              await collector.fail(ex);
            }
          },
          async (domainEvent): Promise<void> => {
            try {
              assert.that(domainEvent).is.atLeast({ id: domainEvent1.id });
              await collector.signal();
            } catch (ex) {
              await collector.fail(ex);
            }
          },
          async (domainEvent): Promise<void> => {
            try {
              assert.that(domainEvent).is.atLeast({ id: domainEvent2.id });
              await collector.signal();
            } catch (ex) {
              await collector.fail(ex);
            }
          }
        ]));

        await collector.promise;
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

        const { client } = await runAsServer({ app: api });

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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo(secondSnapshot);
      });

      test('returns 400 if the aggregate identifier is malformed.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

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

        const { client } = await runAsServer({ app: api });

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
