import { Application } from '../../../../lib/common/application/Application';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { Client } from '../../../../lib/apis/observeDomainEvents/http/v2/Client';
import { createLockStore } from '../../../../lib/stores/lockStore/createLockStore';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/observeDomainEvents/http';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { PublishDomainEvent } from '../../../../lib/apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../lib/common/domain/Repository';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Notification } from '../../../../lib/common/elements/Notification';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';

suite('observeDomainEvents/http/Client', function (): void {
  this.timeout(5_000);

  const identityProviders = [ identityProvider ];

  let application: Application,
      domainEventStore: DomainEventStore,
      publisher: Publisher<Notification>,
      publisherChannelForNotifications: string,
      repository: Repository;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

    application = await loadApplication({ applicationDirectory });
    domainEventStore = await InMemoryDomainEventStore.create({ type: 'InMemory' });
    publisher = await createPublisher<Notification>({ type: 'InMemory' });
    publisherChannelForNotifications = 'notifications';
    repository = new Repository({
      application,
      lockStore: await createLockStore({ type: 'InMemory' }),
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' }),
      publisher,
      publisherChannelForNotifications
    });
  });

  teardown(async (): Promise<void> => {
    await domainEventStore.destroy();
  });

  suite('/v2', (): void => {
    suite('getDescription', (): void => {
      let api: ExpressApplication;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        }));
      });

      test(`returns the domain events' descriptions.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getDescription();

        const { domainEvents: domainEventsDescription } = getApplicationDescription({
          application
        });

        // Convert and parse as JSON, to get rid of any values that are undefined.
        // This is what the HTTP API does internally, and here we need to simulate
        // this to make things work.
        const expectedDomainEventsDescription =
          JSON.parse(JSON.stringify(domainEventsDescription));

        assert.that(data).is.equalTo(expectedDomainEventsDescription);
      });
    });

    suite('getDomainEvents', (): void => {
      let api: ExpressApplication,
          publishDomainEvent: PublishDomainEvent;

      setup(async (): Promise<void> => {
        ({ api, publishDomainEvent } = await getApi({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        }));
      });

      test('delivers a single domain event.', async (): Promise<void> => {
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: 1,
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: executed });
        }, 100);

        const data = await client.getDomainEvents({});

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ],
            true
          ));
        });
      });

      test('delivers multiple domain events.', async (): Promise<void> => {
        const succeeded = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: 1,
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: 2,
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: succeeded });
          publishDomainEvent({ domainEvent: executed });
        }, 100);

        const data = await client.getDomainEvents({});

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('succeeded');
                assert.that(streamElement.data).is.equalTo({});
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ],
            true
          ));
        });
      });

      test('delivers filtered domain events.', async (): Promise<void> => {
        const succeeded = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: 1,
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: 2,
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: succeeded });
          publishDomainEvent({ domainEvent: executed });
        }, 100);

        const data = await client.getDomainEvents({ filter: { name: 'executed' }});

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ],
            true
          ));
        });
      });

      test('delivers filtered domain events with a nested filter.', async (): Promise<void> => {
        const succeeded = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: 1,
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: 2,
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: succeeded });
          publishDomainEvent({ domainEvent: executed });
        }, 100);

        const data = await client.getDomainEvents({ filter: {
          contextIdentifier: { name: 'sampleContext' },
          name: 'executed'
        }});

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ],
            true
          ));
        });
      });

      test('removes state before delivery.', async (): Promise<void> => {
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: 1,
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: executed });
        }, 100);

        const data = await client.getDomainEvents({});

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement.state).is.undefined();
                resolve();
              }
            ],
            true
          ));
        });
      });
    });
  });
});
