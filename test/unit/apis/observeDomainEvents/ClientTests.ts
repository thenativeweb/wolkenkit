import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { Client } from '../../../../lib/apis/observeDomainEvents/http/v2/Client';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { getApi } from '../../../../lib/apis/observeDomainEvents/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory/InMemoryDomainEventStore';
import { PublishDomainEvent } from '../../../../lib/apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../lib/common/domain/Repository';
import { runAsServer } from '../../../shared/http/runAsServer';
import { uuid } from 'uuidv4';

suite('observeDomainEvents/http/Client', function (): void {
  this.timeout(5_000);

  const identityProviders = [ identityProvider ];

  let applicationDefinition: ApplicationDefinition,
      domainEventStore: DomainEventStore,
      repository: Repository;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
    domainEventStore = await InMemoryDomainEventStore.create();
    repository = new Repository({
      applicationDefinition,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' })
    });
  });

  teardown(async (): Promise<void> => {
    await domainEventStore.destroy();
  });

  suite('/v2', (): void => {
    suite('getDescription', (): void => {
      let api: Application;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          applicationDefinition,
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
          applicationDefinition
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
      let api: Application,
          publishDomainEvent: PublishDomainEvent;

      setup(async (): Promise<void> => {
        ({ api, publishDomainEvent } = await getApi({
          corsOrigin: '*',
          applicationDefinition,
          repository,
          identityProviders
        }));
      });

      test('delivers a single domain event.', async (): Promise<void> => {
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 1 },
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
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
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
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
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
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
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
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 1 },
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
