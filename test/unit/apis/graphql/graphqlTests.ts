import { ApolloClient } from 'apollo-client';
import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import fetch from 'node-fetch';
import { getApi } from '../../../../lib/apis/graphql';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getAvailablePort } from '../../../../lib/common/utils/network/getAvailablePort';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import gql from 'graphql-tag';
import http from 'http';
import { HttpLink } from 'apollo-link-http';
import { identityProvider } from '../../../shared/identityProvider';
import { InitializeGraphQlOnServer } from '../../../../lib/apis/graphql/InitializeGraphQlOnServer';
import { Limes } from 'limes';
import { PublishDomainEvent } from '../../../../lib/apis/graphql/PublishDomainEvent';
import { Repository } from '../../../../lib/common/domain/Repository';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { uuid } from 'uuidv4';
import { waitForSignals } from 'wait-for-signals';
import { WebSocketLink } from 'apollo-link-ws';
import ws from 'ws';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';

const sleep = async function (ms: number): Promise<void> {
  return new Promise((resolve): any => setTimeout(resolve, ms));
};

suite('graphql', function (): void {
  this.timeout(5_000);

  const identityProviders = [ identityProvider ];
  let api: Application,
      applicationDefinition: ApplicationDefinition,
      domainEventStore: DomainEventStore,
      initializeGraphQlOnServer: InitializeGraphQlOnServer,
      port: number,
      publishDomainEvent: PublishDomainEvent | undefined,
      receivedCommands: CommandWithMetadata<CommandData>[],
      repository: Repository;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
    domainEventStore = await createDomainEventStore({
      type: 'InMemory',
      options: {}
    });
    repository = new Repository({
      applicationDefinition,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' }),
      domainEventStore
    });
    receivedCommands = [];

    ({ api, publishDomainEvent, initializeGraphQlOnServer } = await getApi({
      identityProviders,
      corsOrigin: '*',
      applicationDefinition,
      handleCommand: {
        async onReceiveCommand ({ command }): Promise<void> {
          receivedCommands.push(command);
        }
      },
      observeDomainEvents: {
        webSocketEndpoint: '/v2/',
        repository
      },
      enableIntegratedClient: false
    }));

    const server = http.createServer(api);

    port = await getAvailablePort();

    await initializeGraphQlOnServer({ server });

    await new Promise((resolve, reject): void => {
      server.listen(port, (): void => {
        resolve();
      });

      server.on('error', (err): void => {
        reject(err);
      });
    });
  });

  suite('handleCommand', (): void => {
    let client: ApolloClient<NormalizedCacheObject>;

    setup(async (): Promise<void> => {
      const link = new HttpLink({
        uri: `http://localhost:${port}/v2/`,
        fetch: fetch as any
      });
      const cache = new InMemoryCache();

      client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });
    });

    test('calls onReceiveCommand for given commands.', async (): Promise<void> => {
      const mutation = gql`
        mutation ($aggregateId: String!, $data: SampleContext_sampleAggregate_executeT0!) {
          sampleContext {
            sampleAggregate (id: $aggregateId) {
              execute(data: $data) {
                id
              }
            }
          }
        }
      `;
      const aggregateId = uuid();

      const response = await client.mutate({
        mutation,
        variables: {
          aggregateId,
          data: {
            strategy: 'succeed'
          }
        }
      });

      assert.that(receivedCommands.length).is.equalTo(1);
      assert.that(receivedCommands[0]).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'execute',
        id: response.data.sampleContext.sampleAggregate.execute.id,
        data: { strategy: 'succeed' }
      });
      assert.that((receivedCommands[0].metadata.client.user.claims as any)['https://token.invalid/is-anonymous']).is.true();
    });
  });

  suite('observeDomainEvents', (): void => {
    let client: ApolloClient<NormalizedCacheObject>;

    setup(async (): Promise<void> => {
      const subscriptionClient = new SubscriptionClient(
        `ws://localhost:${port}/v2/`,
        {},
        ws
      );
      const link = new WebSocketLink(subscriptionClient);
      const cache = new InMemoryCache();

      client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });
    });

    test('publishes domain events via graphql subscription.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const aggregateId = uuid();
      const domainEvent = new DomainEventWithState({
        ...buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        }),
        state: {
          previous: { domainEventNames: []},
          next: { domainEventNames: [ 'succeeded' ]}
        }
      });

      const query = gql`
        subscription {
          domainEvents {
            contextIdentifier {
              name
            }
            aggregateIdentifier {
              name
              id
            }
            name
            id
            data
          }
        }
      `;

      const observable = client.subscribe({
        query
      });

      observable.subscribe(async (message): Promise<void> => {
        try {
          assert.that(message).is.atLeast({
            data: {
              domainEvents: {
                contextIdentifier: domainEvent.contextIdentifier,
                aggregateIdentifier: domainEvent.aggregateIdentifier,
                name: domainEvent.name,
                id: domainEvent.id,
                data: '{}'
              }
            }
          });

          await collector.signal();
        } catch (ex) {
          await collector.fail(ex);
        }
      });

      await sleep(100);

      publishDomainEvent!({ domainEvent });

      await collector.promise;
    });

    test('does not publish the authenticated event to anonymous clients.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const aggregateId = uuid();
      const domainEvent1 = new DomainEventWithState({
        ...buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'authenticated',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        }),
        state: {
          previous: { domainEventNames: []},
          next: { domainEventNames: [ 'succeeded' ]}
        }
      });
      const domainEvent2 = new DomainEventWithState({
        ...buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        }),
        state: {
          previous: { domainEventNames: []},
          next: { domainEventNames: [ 'succeeded' ]}
        }
      });

      const query = gql`
        subscription {
          domainEvents {
            contextIdentifier {
              name
            }
            aggregateIdentifier {
              name
              id
            }
            name
            id
            data
          }
        }
      `;

      const observable = client.subscribe({
        query
      });

      observable.subscribe(async (message): Promise<void> => {
        try {
          assert.that(message).is.atLeast({
            data: { domainEvents: { id: domainEvent2.id }}
          });

          await collector.signal();
        } catch (ex) {
          await collector.fail(ex);
        }
      });

      await sleep(100);

      publishDomainEvent!({ domainEvent: domainEvent1 });
      publishDomainEvent!({ domainEvent: domainEvent2 });

      await collector.promise;
    });

    test('publishes the authenticated event to legitimate clients.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const aggregateId = uuid();
      const domainEvent = new DomainEventWithState({
        ...buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'authenticated',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        }),
        state: {
          previous: { domainEventNames: []},
          next: { domainEventNames: [ 'succeeded' ]}
        }
      });

      const limes = new Limes({ identityProviders: [ identityProvider ]});
      const token = limes.issueToken({
        issuer: 'https://auth.thenativeweb.io',
        subject: 'jane.doe',
        payload: {}
      });

      const subscriptionClient = new SubscriptionClient(
        `ws://localhost:${port}/v2/`,
        {
          connectionParams: {
            token
          }
        },
        ws
      );
      const link = new WebSocketLink(subscriptionClient);
      const cache = new InMemoryCache();

      client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });

      const query = gql`
        subscription {
          domainEvents {
            contextIdentifier {
              name
            }
            aggregateIdentifier {
              name
              id
            }
            name
            id
            data
            metadata {
              initiator {
                user {
                  id
                }
              }
            }
          }
        }
      `;

      const observable = client.subscribe({
        query
      });

      observable.subscribe(async (message): Promise<void> => {
        try {
          assert.that(message).is.atLeast({
            data: { domainEvents: { id: domainEvent.id }}
          });

          await collector.signal();
        } catch (ex) {
          await collector.fail(ex);
        }
      });

      await sleep(100);

      publishDomainEvent!({ domainEvent });

      await collector.promise;
    });
  });
});
