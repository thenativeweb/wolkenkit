"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_client_1 = require("apollo-client");
const assertthat_1 = require("assertthat");
const axios_1 = __importDefault(require("axios"));
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const createDomainEventStore_1 = require("../../../../lib/stores/domainEventStore/createDomainEventStore");
const createLockStore_1 = require("../../../../lib/stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../lib/messaging/pubSub/createSubscriber");
const DomainEventWithState_1 = require("../../../../lib/common/elements/DomainEventWithState");
const node_fetch_1 = __importDefault(require("node-fetch"));
const graphql_1 = require("../../../../lib/apis/graphql");
const getSnapshotStrategy_1 = require("../../../../lib/common/domain/getSnapshotStrategy");
const getSocketPaths_1 = require("../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const apollo_link_http_1 = require("apollo-link-http");
const identityProvider_1 = require("../../../shared/identityProvider");
const limes_1 = require("limes");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const Repository_1 = require("../../../../lib/common/domain/Repository");
const sleep_1 = require("../../../../lib/common/utils/sleep");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
const apollo_link_ws_1 = require("apollo-link-ws");
const ws_1 = __importDefault(require("ws"));
const http_1 = __importStar(require("http"));
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('graphql', function () {
    this.timeout(30000);
    const channelForNotifications = 'notifications', identityProviders = [identityProvider_1.identityProvider];
    let agent, api, application, cancelledCommands, domainEventStore, initializeGraphQlOnServer, publishDomainEvent, publisher, pubSubChannelForNotifications, receivedCommands, repository, socket, subscriber;
    setup(async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withComplexQueries', language: 'javascript' });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        domainEventStore = await createDomainEventStore_1.createDomainEventStore({
            type: 'InMemory'
        });
        publisher = await createPublisher_1.createPublisher({ type: 'InMemory' });
        subscriber = await createSubscriber_1.createSubscriber({ type: 'InMemory' });
        pubSubChannelForNotifications = 'notifications';
        repository = new Repository_1.Repository({
            application,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
            domainEventStore,
            publisher,
            pubSubChannelForNotifications
        });
        receivedCommands = [];
        cancelledCommands = [];
        ({ api, publishDomainEvent, initializeGraphQlOnServer } = await graphql_1.getApi({
            identityProviders,
            corsOrigin: '*',
            application,
            handleCommand: {
                async onReceiveCommand({ command }) {
                    receivedCommands.push(command);
                },
                async onCancelCommand({ commandIdentifierWithClient }) {
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
        const server = http_1.default.createServer(api);
        [socket] = await getSocketPaths_1.getSocketPaths({ count: 1 });
        await initializeGraphQlOnServer({ server });
        await new Promise((resolve, reject) => {
            server.listen(socket, () => {
                resolve();
            });
            server.on('error', (err) => {
                reject(err);
            });
        });
        // The parameter socketPath is necessary for the agent to connect to a
        // unix socket. It is neither document in the node docs nor port of the
        // @types/node package. Relevant issues:
        // https://github.com/node-fetch/node-fetch/issues/336#issuecomment-689623290
        // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/36463
        agent = new http_1.Agent({ socketPath: socket });
    });
    suite('startup', () => {
        test('throws an error if the schema is invalid.', async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withInvalidGraphQlSchema', language: 'javascript' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
            await assertthat_1.assert.that(async () => {
                await graphql_1.getApi({
                    identityProviders,
                    corsOrigin: '*',
                    application,
                    handleCommand: {
                        async onReceiveCommand({ command }) {
                            receivedCommands.push(command);
                        },
                        async onCancelCommand({ commandIdentifierWithClient }) {
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
            }).is.throwingAsync((ex) => ex.code === errors.GraphQlError.code && ex.message === 'GraphQL schema validation failed.');
        });
    });
    suite('handleCommand', () => {
        let client;
        setup(async () => {
            const link = new apollo_link_http_1.HttpLink({
                uri: `http://localhost/v2/`,
                fetch: node_fetch_1.default,
                fetchOptions: { agent }
            });
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
        });
        test('calls onReceiveCommand for given commands.', async () => {
            const mutation = graphql_tag_1.default `
        mutation ($aggregateIdentifier: AggregateIdentifier, $data: SampleContext_sampleAggregate_executeT0!) {
          command {
            sampleContext_sampleAggregate_execute(aggregateIdentifier: $aggregateIdentifier, data: $data) {
              id
            }
          }
        }
      `;
            const aggregateIdentifier = {
                id: uuid_1.v4()
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
            assertthat_1.assert.that(receivedCommands.length).is.equalTo(1);
            assertthat_1.assert.that(receivedCommands[0]).is.atLeast({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateIdentifier.id }
                },
                name: 'execute',
                id: response.data.command.sampleContext_sampleAggregate_execute.id,
                data: { strategy: 'succeed' }
            });
            assertthat_1.assert.that(receivedCommands[0].metadata.client.user.claims['https://token.invalid/is-anonymous']).is.true();
        });
        test('calls onReceiveCommand for given commands, even without aggregate identifier.', async () => {
            const mutation = graphql_tag_1.default `
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
            assertthat_1.assert.that(response.data.command.sampleContext_sampleAggregate_execute.aggregateIdentifier.id).is.not.undefined();
            assertthat_1.assert.that(receivedCommands.length).is.equalTo(1);
            assertthat_1.assert.that(receivedCommands[0]).is.atLeast({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate' }
                },
                name: 'execute',
                id: response.data.command.sampleContext_sampleAggregate_execute.id,
                data: { strategy: 'succeed' }
            });
            assertthat_1.assert.that(receivedCommands[0].metadata.client.user.claims['https://token.invalid/is-anonymous']).is.true();
        });
    });
    suite('cancelCommand', () => {
        let client;
        setup(async () => {
            const link = new apollo_link_http_1.HttpLink({
                uri: `http://localhost/v2/`,
                fetch: node_fetch_1.default,
                fetchOptions: { agent }
            });
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
        });
        test('calls onCancelCommand for requests to cancel commands.', async () => {
            const commandIdentifier = {
                aggregateIdentifier: {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                },
                name: 'execute',
                id: uuid_1.v4()
            };
            const mutation = graphql_tag_1.default `
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
            assertthat_1.assert.that(response.data).is.atLeast({ cancel: { success: true } });
            assertthat_1.assert.that(cancelledCommands.length).is.equalTo(1);
            assertthat_1.assert.that(cancelledCommands[0]).is.atLeast(commandIdentifier);
        });
        test('returns success false if onCancelCommand throws an error.', async () => {
            ({ api, publishDomainEvent, initializeGraphQlOnServer } = await graphql_1.getApi({
                identityProviders,
                corsOrigin: '*',
                application,
                handleCommand: {
                    async onReceiveCommand() {
                        // Intentionally left empty.
                    },
                    async onCancelCommand() {
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
            const server = http_1.default.createServer(api);
            [socket] = await getSocketPaths_1.getSocketPaths({ count: 1 });
            await initializeGraphQlOnServer({ server });
            await new Promise((resolve, reject) => {
                server.listen(socket, () => {
                    resolve();
                });
                server.on('error', (err) => {
                    reject(err);
                });
            });
            agent = new http_1.Agent({ socketPath: socket });
            const link = new apollo_link_http_1.HttpLink({
                uri: `http://localhost/v2/`,
                fetch: node_fetch_1.default,
                fetchOptions: { agent }
            });
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
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
                        id: uuid_1.v4()
                    }
                },
                name: 'execute',
                id: uuid_1.v4()
            };
            const mutation = graphql_tag_1.default `
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
            assertthat_1.assert.that(response.data).is.atLeast({ cancel: { success: false } });
        });
    });
    suite('observeDomainEvents', () => {
        let client;
        setup(async () => {
            const subscriptionClient = new subscriptions_transport_ws_1.SubscriptionClient(`ws+unix://${socket}:/v2/`, {}, ws_1.default);
            const link = new apollo_link_ws_1.WebSocketLink(subscriptionClient);
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
        });
        test('publishes domain events via graphql subscription.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            const aggregateId = uuid_1.v4();
            const domainEvent = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
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
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                }),
                state: {
                    previous: { domainEventNames: [] },
                    next: { domainEventNames: ['succeeded'] }
                }
            });
            const query = graphql_tag_1.default `
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
            observable.subscribe(async (message) => {
                try {
                    assertthat_1.assert.that(message).is.atLeast({
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
                }
                catch (ex) {
                    await collector.fail(ex);
                }
            });
            await sleep_1.sleep({ ms: 100 });
            publishDomainEvent({ domainEvent });
            await collector.promise;
        });
        test('does not publish the authenticated event to anonymous clients.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            const aggregateId = uuid_1.v4();
            const domainEvent1 = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
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
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                }),
                state: {
                    previous: { domainEventNames: [] },
                    next: { domainEventNames: ['succeeded'] }
                }
            });
            const domainEvent2 = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
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
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                }),
                state: {
                    previous: { domainEventNames: [] },
                    next: { domainEventNames: ['succeeded'] }
                }
            });
            const query = graphql_tag_1.default `
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
            observable.subscribe(async (message) => {
                try {
                    assertthat_1.assert.that(message).is.atLeast({
                        data: { domainEvents: { id: domainEvent2.id } }
                    });
                    await collector.signal();
                }
                catch (ex) {
                    await collector.fail(ex);
                }
            });
            await sleep_1.sleep({ ms: 100 });
            publishDomainEvent({ domainEvent: domainEvent1 });
            publishDomainEvent({ domainEvent: domainEvent2 });
            await collector.promise;
        });
        test('publishes the authenticated event to legitimate clients.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            const aggregateId = uuid_1.v4();
            const domainEvent = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
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
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                }),
                state: {
                    previous: { domainEventNames: [] },
                    next: { domainEventNames: ['succeeded'] }
                }
            });
            const limes = new limes_1.Limes({ identityProviders: [identityProvider_1.identityProvider] });
            const token = limes.issueToken({
                issuer: 'https://auth.thenativeweb.io',
                subject: 'jane.doe',
                payload: {}
            });
            const subscriptionClient = new subscriptions_transport_ws_1.SubscriptionClient(`ws+unix://${socket}:/v2/`, {
                connectionParams: {
                    token
                }
            }, ws_1.default);
            const link = new apollo_link_ws_1.WebSocketLink(subscriptionClient);
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
            const query = graphql_tag_1.default `
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
            observable.subscribe(async (message) => {
                try {
                    assertthat_1.assert.that(message).is.atLeast({
                        data: { domainEvents: { id: domainEvent.id } }
                    });
                    await collector.signal();
                }
                catch (ex) {
                    await collector.fail(ex);
                }
            });
            await sleep_1.sleep({ ms: 100 });
            publishDomainEvent({ domainEvent });
            await collector.promise;
        });
        test('publishes rejected/failed events to their initiator.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 2 });
            const aggregateId = uuid_1.v4();
            const domainEvent1 = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
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
                        initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' } } }
                    }
                }),
                state: {
                    previous: { domainEventNames: [] },
                    next: { domainEventNames: ['succeeded'] }
                }
            });
            const domainEvent2 = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
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
                        initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' } } }
                    }
                }),
                state: {
                    previous: { domainEventNames: [] },
                    next: { domainEventNames: ['succeeded'] }
                }
            });
            const query = graphql_tag_1.default `
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
            const subscriptionClient = new subscriptions_transport_ws_1.SubscriptionClient(`ws+unix://${socket}:/v2/`, {
                connectionParams: {
                    'x-anonymous-id': 'jane.doe'
                }
            }, ws_1.default);
            const link = new apollo_link_ws_1.WebSocketLink(subscriptionClient);
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
            const observable = client.subscribe({
                query
            });
            observable.subscribe(async (message) => {
                if (collector.getCount() === 0) {
                    assertthat_1.assert.that(message.data.domainEvents.name).is.equalTo('authenticateFailed');
                    await collector.signal();
                }
                else if (collector.getCount() === 1) {
                    assertthat_1.assert.that(message.data.domainEvents.name).is.equalTo('authenticateRejected');
                    await collector.signal();
                }
                else {
                    await collector.fail();
                }
            });
            await sleep_1.sleep({ ms: 100 });
            publishDomainEvent({ domainEvent: domainEvent1 });
            publishDomainEvent({ domainEvent: domainEvent2 });
            await collector.promise;
        });
        test('does not publish rejected/failed events to other clients than the initiator.', async () => {
            const aggregateId = uuid_1.v4();
            const domainEvent1 = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
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
                        initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' } } }
                    }
                }),
                state: {
                    previous: { domainEventNames: [] },
                    next: { domainEventNames: ['succeeded'] }
                }
            });
            const domainEvent2 = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
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
                        initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' } } }
                    }
                }),
                state: {
                    previous: { domainEventNames: [] },
                    next: { domainEventNames: ['succeeded'] }
                }
            });
            const query = graphql_tag_1.default `
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
            const subscriptionClient = new subscriptions_transport_ws_1.SubscriptionClient(`ws+unix://${socket}:/v2/`, {
                connectionParams: {
                    'x-anonymous-id': 'john.doe'
                }
            }, ws_1.default);
            const link = new apollo_link_ws_1.WebSocketLink(subscriptionClient);
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
            const observable = client.subscribe({
                query
            });
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            observable.subscribe(async () => {
                await collector.fail();
            });
            await sleep_1.sleep({ ms: 100 });
            publishDomainEvent({ domainEvent: domainEvent1 });
            publishDomainEvent({ domainEvent: domainEvent2 });
            setTimeout(async () => {
                await collector.signal();
            }, 200);
            await collector.promise;
        });
        test('can not publish invalid events.', async () => {
            const invalid = { foo: 'bar' };
            await assertthat_1.assert.that(async () => {
                publishDomainEvent({ domainEvent: invalid });
            }).is.throwingAsync((ex) => ex.code === errors.DomainEventMalformed.code);
        });
    });
    suite('observeNotifications', () => {
        let client;
        setup(async () => {
            const subscriptionClient = new subscriptions_transport_ws_1.SubscriptionClient(`ws+unix://${socket}:/v2/`, {}, ws_1.default);
            const link = new apollo_link_ws_1.WebSocketLink(subscriptionClient);
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
        });
        test('delivers notifications via graphql subscription.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            const notification = { name: 'complex', data: { message: '1' }, metadata: { public: true } };
            const query = graphql_tag_1.default `
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
            observable.subscribe(async (message) => {
                try {
                    assertthat_1.assert.that(message).is.atLeast({
                        data: {
                            notifications: {
                                name: 'complex',
                                data: '{"message":"1"}'
                            }
                        }
                    });
                    await collector.signal();
                }
                catch (ex) {
                    await collector.fail(ex);
                }
            });
            await sleep_1.sleep({ ms: 100 });
            await publisher.publish({ channel: channelForNotifications, message: notification });
            await collector.promise;
        });
        test('delivers only authorized notifications.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: false } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
            const query = graphql_tag_1.default `
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
            observable.subscribe(async (message) => {
                try {
                    assertthat_1.assert.that(message).is.atLeast({
                        data: {
                            notifications: {
                                name: 'complex',
                                data: '{"message":"2"}'
                            }
                        }
                    });
                    await collector.signal();
                }
                catch (ex) {
                    await collector.fail(ex);
                }
            });
            await sleep_1.sleep({ ms: 100 });
            await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
            await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
            await collector.promise;
        });
        test('does not deliver unknown notifications.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            const notificationFirst = { name: 'non-existent', data: {} }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
            const query = graphql_tag_1.default `
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
            observable.subscribe(async (message) => {
                try {
                    assertthat_1.assert.that(message).is.atLeast({
                        data: {
                            notifications: {
                                name: 'complex',
                                data: '{"message":"2"}'
                            }
                        }
                    });
                    await collector.signal();
                }
                catch (ex) {
                    await collector.fail(ex);
                }
            });
            await sleep_1.sleep({ ms: 100 });
            await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
            await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
            await collector.promise;
        });
        test('does not deliver invalid notifications.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            const notificationFirst = { name: 'complex', data: { foo: 'bar' } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
            const query = graphql_tag_1.default `
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
            observable.subscribe(async (message) => {
                try {
                    assertthat_1.assert.that(message).is.atLeast({
                        data: {
                            notifications: {
                                name: 'complex',
                                data: '{"message":"2"}'
                            }
                        }
                    });
                    await collector.signal();
                }
                catch (ex) {
                    await collector.fail(ex);
                }
            });
            await sleep_1.sleep({ ms: 100 });
            await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
            await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
            await collector.promise;
        });
        test('delivers multiple notifications.', async () => {
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: true } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
            const query = graphql_tag_1.default `
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
            observable.subscribe(async () => {
                await collector.signal();
            });
            await sleep_1.sleep({ ms: 100 });
            await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
            await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
            await collector.promise;
        });
    });
    suite('queryView', () => {
        let client;
        setup(async () => {
            const link = new apollo_link_http_1.HttpLink({
                uri: `http://localhost/v2/`,
                fetch: node_fetch_1.default,
                fetchOptions: { agent }
            });
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
        });
        test('returns the result items returned by the query.', async () => {
            const viewItems = [
                {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'executed',
                    id: uuid_1.v4()
                },
                {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'executed',
                    id: uuid_1.v4()
                }
            ];
            application.infrastructure.ask.viewStore.domainEvents.push(...viewItems);
            const query = graphql_tag_1.default `
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
            assertthat_1.assert.that(response.data).is.atLeast({
                sampleView: {
                    all: [
                        {
                            aggregateIdentifier: { context: { name: 'sampleContext' } },
                            id: viewItems[0].id
                        },
                        {
                            aggregateIdentifier: { context: { name: 'sampleContext' } },
                            id: viewItems[1].id
                        }
                    ]
                }
            });
        });
    });
    suite('various', () => {
        test('sets the expected cors header.', async () => {
            const corsOrigin = 'some.cool.domain';
            ({ api, publishDomainEvent, initializeGraphQlOnServer } = await graphql_1.getApi({
                identityProviders,
                corsOrigin: [corsOrigin],
                application,
                handleCommand: {
                    async onReceiveCommand({ command }) {
                        receivedCommands.push(command);
                    },
                    async onCancelCommand({ commandIdentifierWithClient }) {
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
            const server = http_1.default.createServer(api);
            [socket] = await getSocketPaths_1.getSocketPaths({ count: 1 });
            await initializeGraphQlOnServer({ server });
            await new Promise((resolve, reject) => {
                server.listen(socket, () => {
                    resolve();
                });
                server.on('error', (err) => {
                    reject(err);
                });
            });
            const { headers } = await axios_1.default({
                url: 'http://localhost/v2/',
                validateStatus: () => true,
                socketPath: socket,
                headers: {
                    'Content-Type': 'application/json',
                    Origin: corsOrigin
                },
                method: 'POST',
                data: { query: '{ sampleView { all { id }}}' }
            });
            assertthat_1.assert.that(headers['access-control-allow-origin']).is.equalTo(corsOrigin);
        });
    });
});
//# sourceMappingURL=graphqlTests.js.map