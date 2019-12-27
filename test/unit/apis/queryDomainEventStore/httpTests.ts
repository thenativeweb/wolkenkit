import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from 'express';
import { asJsonStream } from 'test/shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { createDomainEventStore } from 'lib/stores/domainEventStore/createDomainEventStore';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
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
        newDomainEventPublisher: Publisher<DomainEvent<DomainEventData>>,
        newDomainEventSubscriber: Subscriber<DomainEvent<DomainEventData>>,
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

    suite('GET /replay', (): void => {
      test('returns a stream that sends a heartbeat and then ends instantly if there are no domain events to deliver.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

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

        const client = await runAsServer({ app: api });

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

        const client = await runAsServer({ app: api });

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

      test('leaves the stream open when observe is true and sends domain events when they are published.', async (): Promise<void> => {
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

        const client = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: '/v2/replay?observe=true',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

        await new Promise(async (resolve, reject): Promise<void> => {
          data.on('error', reject);
          data.on('end', (): void => {
            reject(new Error('The stream should not have ended.'));
          });

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
            },
            (domainEvent): void => {
              assert.that(domainEvent).is.equalTo(firstDomainEvent);

              resolve();
            }
          ]));

          await newDomainEventPublisher.publish({
            channel: newDomainEventSubscriberChannel,
            message: firstDomainEvent
          });
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
            revision: { aggregate: 3, global: 3 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        const client = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: '/v2/replay?observe=true&toRevisionGlobal=2',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

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

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              counter += 1;
            },
            (): void => {
              reject(new Error('Should not have received more than a heartbeat.'));
            }
          ]));

          await newDomainEventPublisher.publish({
            channel: newDomainEventSubscriberChannel,
            message: firstDomainEvent
          });
        });
      });

      test('returns 400 if the parameter fromRevisionGlobal is less than 1.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?fromRevisionGlobal=0',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'fromRevisionGlobal' must be at least 1.`);
      });

      test('returns 400 if the parameter fromRevisionGlobal is not a number.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?fromRevisionGlobal=foo',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'fromRevisionGlobal' must be a number.`);
      });

      test('returns 400 if the parameter toRevisionGlobal is less than 1.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?toRevisionGlobal=0',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevisionGlobal' must be at least 1.`);
      });

      test('returns 400 if the parameter toRevisionGlobal is not a number.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?toRevisionGlobal=foo',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevisionGlobal' must be a number.`);
      });

      test(`returns 400 if the parameter 'fromRevisionGlobal' is greater than 'toRevisionGlobal'.`, async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?fromRevisionGlobal=4&toRevisionGlobal=2',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevisionGlobal' must be greater or equal to 'fromRevisionGlobal'.`);
      });

      test(`returns 400 if the parameter observe is neither 'true' nor 'false'.`, async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/replay?observe=foo',
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'observe' must be either 'true' or 'false'.`);
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

        const client = await runAsServer({ app: api });

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

        const client = await runAsServer({ app: api });

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

        const client = await runAsServer({ app: api });

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

      test('leaves the stream open when observe is true and sends domain events when they are published.', async (): Promise<void> => {
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

        const client = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/replay/${aggregateIdentifier.id}?observe=true`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

        await new Promise(async (resolve, reject): Promise<void> => {
          data.on('error', reject);
          data.on('end', (): void => {
            reject(new Error('The stream should not have ended.'));
          });

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
            },
            (domainEvent): void => {
              assert.that(domainEvent).is.equalTo(firstDomainEvent);

              resolve();
            }
          ]));

          await newDomainEventPublisher.publish({
            channel: newDomainEventSubscriberChannel,
            message: firstDomainEvent
          });
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
            revision: { aggregate: 3, global: 3 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        const client = await runAsServer({ app: api });

        const { status, data, headers } = await client({
          method: 'get',
          url: `/v2/replay/${aggregateIdentifier.id}?observe=true&toRevision=2`,
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['content-type']).is.equalTo('application/x-ndjson');

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

          data.pipe(asJsonStream([
            (heartbeat): void => {
              assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
              counter += 1;
            },
            (): void => {
              reject(new Error('Should not have received more than a heartbeat.'));
            }
          ]));

          await newDomainEventPublisher.publish({
            channel: newDomainEventSubscriberChannel,
            message: firstDomainEvent
          });
        });
      });

      test('returns 400 if the parameter fromRevision is less than 1.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?fromRevision=0`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'fromRevision' must be at least 1.`);
      });

      test('returns 400 if the parameter fromRevision is not a number.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?fromRevision=foo`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'fromRevision' must be a number.`);
      });

      test('returns 400 if the parameter toRevision is less than 1.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?toRevision=0`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevision' must be at least 1.`);
      });

      test('returns 400 if the parameter toRevision is not a number.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?toRevision=foo`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevision' must be a number.`);
      });

      test(`returns 400 if the parameter 'fromRevision' is greater than 'toRevision'.`, async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?fromRevision=4&toRevision=2`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
      });

      test(`returns 400 if the parameter observe is neither 'true' nor 'false'.`, async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: `/v2/replay/${uuid()}?observe=foo`,
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo(`Query parameter 'observe' must be either 'true' or 'false'.`);
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
