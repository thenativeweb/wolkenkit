import { ApolloClient } from 'apollo-client';
import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../lib/stores/lockStore/createLockStore';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../lib/messaging/pubSub/createSubscriber';
import { CustomError } from 'defekt';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import fetch from 'node-fetch';
import { getApi } from '../../../../lib/apis/graphql';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getSocketPaths } from '../../../shared/getSocketPaths';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import gql from 'graphql-tag';
import { HttpLink } from 'apollo-link-http';
import { identityProvider } from '../../../shared/identityProvider';
import { InitializeGraphQlOnServer } from '../../../../lib/apis/graphql/InitializeGraphQlOnServer';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { Limes } from 'limes';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { Notification } from '../../../../lib/common/elements/Notification';
import { PublishDomainEvent } from '../../../../lib/apis/graphql/PublishDomainEvent';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Repository } from '../../../../lib/common/domain/Repository';
import { sleep } from '../../../../lib/common/utils/sleep';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { v4 } from 'uuid';
import { waitForSignals } from 'wait-for-signals';
import { WebSocketLink } from 'apollo-link-ws';
import ws from 'ws';
import http, { Agent } from 'http';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';

suite('graphql', function (): void {
  this.timeout(15_000);

  const channelForNotifications = 'notifications',
        identityProviders = [ identityProvider ];

  let agent: Agent,
      api: ExpressApplication,
      application: Application,
      cancelledCommands: ItemIdentifierWithClient[],
      domainEventStore: DomainEventStore,
      initializeGraphQlOnServer: InitializeGraphQlOnServer,
      publishDomainEvent: PublishDomainEvent | undefined,
      publisher: Publisher<Notification>,
      pubSubChannelForNotifications: string,
      receivedCommands: CommandWithMetadata<CommandData>[],
      repository: Repository,
      socket: string,
      subscriber: Subscriber<Notification>;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

    application = await loadApplication({ applicationDirectory });
    domainEventStore = await createDomainEventStore({
      type: 'InMemory'
    });
    publisher = await createPublisher<Notification>({ type: 'InMemory' });
    subscriber = await createSubscriber<Notification>({ type: 'InMemory' });
    pubSubChannelForNotifications = 'notifications';
    repository = new Repository({
      application,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' }),
      lockStore: await createLockStore({ type: 'InMemory' }),
      domainEventStore,
      publisher,
      pubSubChannelForNotifications
    });
    receivedCommands = [];
    cancelledCommands = [];

    ({ api, publishDomainEvent, initializeGraphQlOnServer } = await getApi({
      identityProviders,
      corsOrigin: '*',
      application,
      handleCommand: {
        async onReceiveCommand ({ command }): Promise<void> {
          receivedCommands.push(command);
        },
        async onCancelCommand ({ commandIdentifierWithClient }): Promise<void> {
          cancelledCommands.push(commandIdentifierWithClient);
        }
      },
      observeDomainEvents: {
        repository
      },
      observeNotifications: {
        subscriber,
        channelForNotifications
      },
      queryView: true,
      enableIntegratedClient: false,
      webSocketEndpoint: '/v2/'
    }));

    const server = http.createServer(api);

    [ socket ] = await getSocketPaths({ count: 1 });

    await initializeGraphQlOnServer({ server });

    await new Promise<void>((resolve, reject): void => {
      server.listen(socket, (): void => {
        resolve();
      });

      server.on('error', (err): void => {
        reject(err);
      });
    });

    // The parameter socketPath is necessary for the agent to connect to a
    // unix socket. It is neither document in the node docs nor port of the
    // @types/node package. Relevant issues:
    // https://github.com/node-fetch/node-fetch/issues/336#issuecomment-689623290
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/36463
    agent = new Agent({ socketPath: socket } as any);
  });

  suite('startup', (): void => {
    test('throws an error if the schema is invalid.', async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'withInvalidGraphQlSchema', language: 'javascript' });

      application = await loadApplication({ applicationDirectory });

      await assert.that(async (): Promise<void> => {
        await getApi({
          identityProviders,
          corsOrigin: '*',
          application,
          handleCommand: {
            async onReceiveCommand ({ command }): Promise<void> {
              receivedCommands.push(command);
            },
            async onCancelCommand ({ commandIdentifierWithClient }): Promise<void> {
              cancelledCommands.push(commandIdentifierWithClient);
            }
          },
          observeDomainEvents: {
            repository
          },
          observeNotifications: {
            subscriber,
            channelForNotifications
          },
          queryView: true,
          enableIntegratedClient: false,
          webSocketEndpoint: '/v2/'
        });
      }).is.throwingAsync<CustomError>((ex): boolean =>
        ex.code === 'EGRAPHQLERROR' && ex.message === 'GraphQL schema validation failed.');
    });
  });

  suite('handleCommand', (): void => {
    let client: ApolloClient<NormalizedCacheObject>;

    setup(async (): Promise<void> => {
      const link = new HttpLink({
        uri: `http://localhost/v2/`,
        fetch: fetch as any,
        fetchOptions: { agent }
      });
      const cache = new InMemoryCache();

      client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });
    });

    test('calls onReceiveCommand for given commands.', async (): Promise<void> => {
      const mutation = gql`
        mutation ($aggregateIdentifier: AggregateIdentifier, $data: SampleContext_sampleAggregate_executeT0!) {
          command {
            sampleContext_sampleAggregate_execute(aggregateIdentifier: $aggregateIdentifier, data: $data) {
              id
            }
          }
        }
      `;
      const aggregateIdentifier = {
        id: v4()
      };

      const response = await client.mutate({
        mutation,
        variables: {
          aggregateIdentifier,
          data: {
            strategy: 'succeed'
          }
        }
      });

      assert.that(receivedCommands.length).is.equalTo(1);
      assert.that(receivedCommands[0]).is.atLeast({
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateIdentifier.id }
        },
        name: 'execute',
        id: response.data.command.sampleContext_sampleAggregate_execute.id,
        data: { strategy: 'succeed' }
      });
      assert.that((receivedCommands[0].metadata.client.user.claims as any)['https://token.invalid/is-anonymous']).is.true();
    });

    test('calls onReceiveCommand for given commands, even without aggregate identifier.', async (): Promise<void> => {
      const mutation = gql`
        mutation ($data: SampleContext_sampleAggregate_executeT0!) {
          command {
            sampleContext_sampleAggregate_execute(data: $data) {
              id
              aggregateIdentifier {
                id
              }
            }
          }
        }
      `;

      const response = await client.mutate({
        mutation,
        variables: {
          data: {
            strategy: 'succeed'
          }
        }
      });

      assert.that(response.data.command.sampleContext_sampleAggregate_execute.aggregateIdentifier.id).is.not.undefined();
      assert.that(receivedCommands.length).is.equalTo(1);
      assert.that(receivedCommands[0]).is.atLeast({
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate' }
        },
        name: 'execute',
        id: response.data.command.sampleContext_sampleAggregate_execute.id,
        data: { strategy: 'succeed' }
      });
      assert.that((receivedCommands[0].metadata.client.user.claims as any)['https://token.invalid/is-anonymous']).is.true();
    });
  });

  suite('cancelCommand', (): void => {
    let client: ApolloClient<NormalizedCacheObject>;

    setup(async (): Promise<void> => {
      const link = new HttpLink({
        uri: `http://localhost/v2/`,
        fetch: fetch as any,
        fetchOptions: { agent }
      });
      const cache = new InMemoryCache();

      client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });
    });

    test('calls onCancelCommand for requests to cancel commands.', async (): Promise<void> => {
      const commandIdentifier = {
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
        id: v4()
      };
      const mutation = gql`
        mutation ($data: CommandIdentifierT0!) {
          cancel (commandIdentifier: $data) {
            success
          }
        }
      `;

      const response = await client.mutate({
        mutation,
        variables: {
          data: commandIdentifier
        }
      });

      assert.that(response.data).is.atLeast({ cancel: { success: true }});
      assert.that(cancelledCommands.length).is.equalTo(1);
      assert.that(cancelledCommands[0]).is.atLeast(commandIdentifier);
    });

    test('returns success false if onCancelCommand throws an error.', async (): Promise<void> => {
      ({ api, publishDomainEvent, initializeGraphQlOnServer } = await getApi({
        identityProviders,
        corsOrigin: '*',
        application,
        handleCommand: {
          async onReceiveCommand (): Promise<void> {
            // Intentionally left empty.
          },
          async onCancelCommand (): Promise<void> {
            // eslint-disable-next-line unicorn/error-message
            throw new Error();
          }
        },
        observeDomainEvents: {
          repository
        },
        observeNotifications: {
          subscriber,
          channelForNotifications
        },
        queryView: true,
        enableIntegratedClient: false,
        webSocketEndpoint: '/v2/'
      }));

      const server = http.createServer(api);

      [ socket ] = await getSocketPaths({ count: 1 });

      await initializeGraphQlOnServer({ server });

      await new Promise<void>((resolve, reject): void => {
        server.listen(socket, (): void => {
          resolve();
        });

        server.on('error', (err): void => {
          reject(err);
        });
      });

      agent = new Agent({ socketPath: socket } as any);

      const link = new HttpLink({
        uri: `http://localhost/v2/`,
        fetch: fetch as any,
        fetchOptions: { agent }
      });
      const cache = new InMemoryCache();

      client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });

      const commandIdentifier = {
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
        id: v4()
      };
      const mutation = gql`
        mutation ($data: CommandIdentifierT0!) {
          cancel (commandIdentifier: $data) {
            success
          }
        }
      `;

      const response = await client.mutate({
        mutation,
        variables: {
          data: commandIdentifier
        }
      });

      assert.that(response.data).is.atLeast({ cancel: { success: false }});
    });
  });

  suite('observeDomainEvents', (): void => {
    let client: ApolloClient<NormalizedCacheObject>;

    setup(async (): Promise<void> => {
      const subscriptionClient = new SubscriptionClient(
        `ws+unix://${socket}:/v2/`,
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

      const aggregateId = v4();
      const domainEvent = new DomainEventWithState({
        ...buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
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
            aggregateIdentifier {
              context {
                name
              }
              aggregate {
                name
                id
              }
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
                aggregateIdentifier: domainEvent.aggregateIdentifier,
                name: domainEvent.name,
                id: domainEvent.id,
                data: '{}'
              }
            }
          });

          await collector.signal();
        } catch (ex: unknown) {
          await collector.fail(ex);
        }
      });

      await sleep({ ms: 100 });

      publishDomainEvent!({ domainEvent });

      await collector.promise;
    });

    test('does not publish the authenticated event to anonymous clients.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const aggregateId = v4();
      const domainEvent1 = new DomainEventWithState({
        ...buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'authenticated',
          data: {},
          metadata: {
            revision: 1,
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
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
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
            aggregateIdentifier {
              context {
                name
              }
              aggregate {
                name
                id
              }
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
        } catch (ex: unknown) {
          await collector.fail(ex);
        }
      });

      await sleep({ ms: 100 });

      publishDomainEvent!({ domainEvent: domainEvent1 });
      publishDomainEvent!({ domainEvent: domainEvent2 });

      await collector.promise;
    });

    test('publishes the authenticated event to legitimate clients.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const aggregateId = v4();
      const domainEvent = new DomainEventWithState({
        ...buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'authenticated',
          data: {},
          metadata: {
            revision: 1,
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
        `ws+unix://${socket}:/v2/`,
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
            aggregateIdentifier {
              context {
                name
              }
              aggregate {
                name
                id
              }
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
        } catch (ex: unknown) {
          await collector.fail(ex);
        }
      });

      await sleep({ ms: 100 });

      publishDomainEvent!({ domainEvent });

      await collector.promise;
    });

    test('publishes rejected/failed events to their initiator.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 2 });

      const aggregateId = v4();
      const domainEvent1 = new DomainEventWithState({
        ...buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'authenticateFailed',
          data: { reason: 'some reason' },
          metadata: {
            revision: 1,
            initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' }}}
          }
        }),
        state: {
          previous: { domainEventNames: []},
          next: { domainEventNames: [ 'succeeded' ]}
        }
      });
      const domainEvent2 = new DomainEventWithState({
        ...buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'authenticateRejected',
          data: { reason: 'some reason' },
          metadata: {
            revision: 1,
            initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' }}}
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
            aggregateIdentifier {
              context {
                name
              }
              aggregate {
                name
                id
              }
            }
            name
            id
            data
          }
        }
      `;

      const subscriptionClient = new SubscriptionClient(
        `ws+unix://${socket}:/v2/`,
        {
          connectionParams: {
            'x-anonymous-id': 'jane.doe'
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
      const observable = client.subscribe({
        query
      });

      observable.subscribe(async (message): Promise<void> => {
        if (collector.getCount() === 0) {
          assert.that(message.data.domainEvents.name).is.equalTo('authenticateFailed');
          await collector.signal();
        } else if (collector.getCount() === 1) {
          assert.that(message.data.domainEvents.name).is.equalTo('authenticateRejected');
          await collector.signal();
        } else {
          await collector.fail();
        }
      });

      await sleep({ ms: 100 });

      publishDomainEvent!({ domainEvent: domainEvent1 });
      publishDomainEvent!({ domainEvent: domainEvent2 });

      await collector.promise;
    });

    test('does not publish rejected/failed events to other clients than the initiator.', async (): Promise<void> => {
      const aggregateId = v4();
      const domainEvent1 = new DomainEventWithState({
        ...buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'authenticateFailed',
          data: { reason: 'some reason' },
          metadata: {
            revision: 1,
            initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' }}}
          }
        }),
        state: {
          previous: { domainEventNames: []},
          next: { domainEventNames: [ 'succeeded' ]}
        }
      });
      const domainEvent2 = new DomainEventWithState({
        ...buildDomainEvent({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'authenticateRejected',
          data: { reason: 'some reason' },
          metadata: {
            revision: 1,
            initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' }}}
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
            aggregateIdentifier {
              context {
                name
              }
              aggregate {
                name
                id
              }
            }
            name
            id
            data
          }
        }
      `;

      const subscriptionClient = new SubscriptionClient(
        `ws+unix://${socket}:/v2/`,
        {
          connectionParams: {
            'x-anonymous-id': 'john.doe'
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
      const observable = client.subscribe({
        query
      });

      const collector = waitForSignals({ count: 1 });

      observable.subscribe(async (): Promise<void> => {
        await collector.fail();
      });

      await sleep({ ms: 100 });

      publishDomainEvent!({ domainEvent: domainEvent1 });
      publishDomainEvent!({ domainEvent: domainEvent2 });

      setTimeout(async (): Promise<void> => {
        await collector.signal();
      }, 200);

      await collector.promise;
    });

    test('can not publish invalid events.', async (): Promise<void> => {
      const invalid = { foo: 'bar' };

      await assert.that(async (): Promise<void> => {
        publishDomainEvent!({ domainEvent: invalid as any });
      }).is.throwingAsync<CustomError>(
        (ex): boolean => ex.code === errors.DomainEventMalformed.code
      );
    });
  });

  suite('observeNotifications', (): void => {
    let client: ApolloClient<NormalizedCacheObject>;

    setup(async (): Promise<void> => {
      const subscriptionClient = new SubscriptionClient(
        `ws+unix://${socket}:/v2/`,
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

    test('delivers notifications via graphql subscription.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const notification = { name: 'complex', data: { message: '1' }, metadata: { public: true }};

      const query = gql`
        subscription {
          notifications {
            name
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
              notifications: {
                name: 'complex',
                data: '{"message":"1"}'
              }
            }
          });

          await collector.signal();
        } catch (ex: unknown) {
          await collector.fail(ex);
        }
      });

      await sleep({ ms: 100 });

      await publisher.publish({ channel: channelForNotifications, message: notification });

      await collector.promise;
    });

    test('delivers only authorized notifications.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: false }},
            notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

      const query = gql`
        subscription {
          notifications {
            name
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
              notifications: {
                name: 'complex',
                data: '{"message":"2"}'
              }
            }
          });

          await collector.signal();
        } catch (ex: unknown) {
          await collector.fail(ex);
        }
      });

      await sleep({ ms: 100 });

      await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
      await publisher.publish({ channel: channelForNotifications, message: notificationSecond });

      await collector.promise;
    });

    test('does not deliver unknown notifications.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const notificationFirst = { name: 'non-existent', data: {}},
            notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

      const query = gql`
        subscription {
          notifications {
            name
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
              notifications: {
                name: 'complex',
                data: '{"message":"2"}'
              }
            }
          });

          await collector.signal();
        } catch (ex: unknown) {
          await collector.fail(ex);
        }
      });

      await sleep({ ms: 100 });

      await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
      await publisher.publish({ channel: channelForNotifications, message: notificationSecond });

      await collector.promise;
    });

    test('does not deliver invalid notifications.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const notificationFirst = { name: 'complex', data: { foo: 'bar' }},
            notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

      const query = gql`
        subscription {
          notifications {
            name
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
              notifications: {
                name: 'complex',
                data: '{"message":"2"}'
              }
            }
          });

          await collector.signal();
        } catch (ex: unknown) {
          await collector.fail(ex);
        }
      });

      await sleep({ ms: 100 });

      await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
      await publisher.publish({ channel: channelForNotifications, message: notificationSecond });

      await collector.promise;
    });

    test('delivers multiple notifications.', async (): Promise<void> => {
      const collector = waitForSignals({ count: 1 });

      const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: true }},
            notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true }};

      const query = gql`
        subscription {
          notifications {
            name
            data
          }
        }
      `;

      const observable = client.subscribe({
        query
      });

      observable.subscribe(async (): Promise<void> => {
        await collector.signal();
      });

      await sleep({ ms: 100 });

      await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
      await publisher.publish({ channel: channelForNotifications, message: notificationSecond });

      await collector.promise;
    });
  });

  suite('queryView', (): void => {
    let client: ApolloClient<NormalizedCacheObject>;

    setup(async (): Promise<void> => {
      const link = new HttpLink({
        uri: `http://localhost/v2/`,
        fetch: fetch as any,
        fetchOptions: { agent }
      });
      const cache = new InMemoryCache();

      client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });
    });

    test('returns the result items returned by the query.', async (): Promise<void> => {
      const viewItems = [
        {
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
          name: 'executed',
          id: v4()
        },
        {
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
          name: 'executed',
          id: v4()
        }
      ];

      (application.infrastructure.ask as any).viewStore.domainEvents.push(...viewItems);

      const query = gql`
        query {
          sampleView {
            all {
              aggregateIdentifier {
                context {
                  name
                }
              }
              id
            }
          }
        }
      `;

      const response = await client.query({ query });

      assert.that(response.data).is.atLeast({
        sampleView: {
          all: [
            {
              aggregateIdentifier: { context: { name: 'sampleContext' }},
              id: viewItems[0].id
            },
            {
              aggregateIdentifier: { context: { name: 'sampleContext' }},
              id: viewItems[1].id
            }
          ]
        }
      });
    });
  });
});
