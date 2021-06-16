"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const apollo_client_1 = require("apollo-client");
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../../lib/common/utils/test/buildDomainEvent");
const Client_1 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const Client_2 = require("../../../../../lib/apis/awaitItem/http/v2/Client");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition");
const CommandWithMetadata_1 = require("../../../../../lib/common/elements/CommandWithMetadata");
const configurationDefinition_2 = require("../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition");
const DomainEventWithState_1 = require("../../../../../lib/common/elements/DomainEventWithState");
const node_fetch_1 = __importDefault(require("node-fetch"));
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const configurationDefinition_3 = require("../../../../../lib/runtimes/microservice/processes/graphql/configurationDefinition");
const apollo_link_http_1 = require("apollo-link-http");
const configurationDefinition_4 = require("../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition");
const Client_3 = require("../../../../../lib/apis/publishMessage/http/v2/Client");
const sleep_1 = require("../../../../../lib/common/utils/sleep");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
const apollo_link_ws_1 = require("apollo-link-ws");
const ws_1 = __importDefault(require("ws"));
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
suite('graphql process', function () {
    this.timeout(60000);
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const subscribeMessagesChannel = 'new-domain-event', subscribeNotificationsChannel = 'notifications';
    let agent, commandDispatcherClient, commandDispatcherHealthSocket, commandDispatcherSocket, domainEventStoreHealthSocket, domainEventStoreSocket, healthSocket, publisherHealthSocket, publisherSocket, publishMessageClient, socket, stopProcess, stopProcessCommandDispatcher, stopProcessDomainEventStore, stopProcessPublisher;
    setup(async () => {
        [
            socket,
            healthSocket,
            commandDispatcherSocket,
            commandDispatcherHealthSocket,
            domainEventStoreSocket,
            domainEventStoreHealthSocket,
            publisherSocket,
            publisherHealthSocket
        ] = await getSocketPaths_1.getSocketPaths({ count: 8 });
        const domainEventStoreConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_2.configurationDefinition }),
            portOrSocket: domainEventStoreSocket,
            healthPortOrSocket: domainEventStoreHealthSocket
        };
        stopProcessDomainEventStore = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'domainEventStore',
            enableDebugMode: false,
            portOrSocket: domainEventStoreHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: domainEventStoreConfiguration,
                configurationDefinition: configurationDefinition_2.configurationDefinition
            })
        });
        const commandDispatcherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            applicationDirectory,
            priorityQueueStoreOptions: { type: 'InMemory', expirationTime: 5000 },
            portOrSocket: commandDispatcherSocket,
            healthPortOrSocket: commandDispatcherHealthSocket
        };
        stopProcessCommandDispatcher = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'commandDispatcher',
            enableDebugMode: false,
            portOrSocket: commandDispatcherHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: commandDispatcherConfiguration,
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        commandDispatcherClient = new Client_2.Client({
            portOrSocket: commandDispatcherSocket,
            hostName: 'localhost',
            path: '/await-command/v2',
            protocol: 'http',
            createItemInstance({ item }) {
                return new CommandWithMetadata_1.CommandWithMetadata(item);
            }
        });
        const publisherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_4.configurationDefinition }),
            portOrSocket: publisherSocket,
            healthPortOrSocket: publisherHealthSocket
        };
        stopProcessPublisher = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'publisher',
            enableDebugMode: false,
            portOrSocket: publisherHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: publisherConfiguration,
                configurationDefinition: configurationDefinition_4.configurationDefinition
            })
        });
        publishMessageClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: publisherSocket,
            path: '/publish/v2'
        });
        const graphqlConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_3.configurationDefinition }),
            applicationDirectory,
            aeonstoreHostName: 'localhost',
            aeonstorePortOrSocket: domainEventStoreSocket,
            enableIntegratedClient: false,
            commandDispatcherHostName: 'localhost',
            commandDispatcherPortOrSocket: commandDispatcherSocket,
            commandDispatcherRetries: 5,
            healthPortOrSocket: healthSocket,
            portOrSocket: socket,
            pubSubOptions: {
                channelForNewDomainEvents: subscribeMessagesChannel,
                channelForNotifications: subscribeNotificationsChannel,
                publisher: { type: 'InMemory' },
                subscriber: {
                    type: 'Http',
                    hostName: 'localhost',
                    portOrSocket: publisherSocket,
                    path: '/subscribe/v2'
                }
            },
            snapshotStrategy: { name: 'never' }
        };
        stopProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'graphql',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: graphqlConfiguration,
                configurationDefinition: configurationDefinition_3.configurationDefinition
            })
        });
        // The parameter socketPath is necessary for the agent to connect to a
        // unix socket. It is neither document in the node docs nor port of the
        // @types/node package. Relevant issues:
        // https://github.com/node-fetch/node-fetch/issues/336#issuecomment-689623290
        // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/36463
        agent = new http_1.Agent({ socketPath: socket });
    });
    teardown(async () => {
        if (stopProcess) {
            await stopProcess();
        }
        if (stopProcessPublisher) {
            await stopProcessPublisher();
        }
        if (stopProcessCommandDispatcher) {
            await stopProcessCommandDispatcher();
        }
        if (stopProcessDomainEventStore) {
            await stopProcessDomainEventStore();
        }
        stopProcess = undefined;
        stopProcessPublisher = undefined;
        stopProcessCommandDispatcher = undefined;
        stopProcessDomainEventStore = undefined;
    });
    suite('getHealth', () => {
        test('is using the health API.', async () => {
            const healthClient = new Client_1.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: healthSocket,
                path: '/health/v2'
            });
            await assertthat_1.assert.that(async () => await healthClient.getHealth()).is.not.throwingAsync();
        });
    });
    suite('graphql', () => {
        test('has a command mutation endpoint.', async () => {
            var _a, _b;
            const link = new apollo_link_http_1.HttpLink({
                uri: `http://localhost/graphql/v2`,
                fetch: node_fetch_1.default,
                fetchOptions: { agent }
            });
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            const client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
            const mutation = graphql_tag_1.default `
        mutation ($aggregateIdentifier: AggregateIdentifier, $data: SampleContext_sampleAggregate_executeT0!) {
          command {
            sampleContext_sampleAggregate_execute(aggregateIdentifier: $aggregateIdentifier, data: $data) {
              id
            }
          }
        }
      `;
            const result = await client.mutate({
                mutation,
                variables: {
                    aggregateIdentifier: {
                        id: uuid_1.v4()
                    },
                    data: {
                        strategy: 'succeed'
                    }
                }
            });
            assertthat_1.assert.that((_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a.command.sampleContext_sampleAggregate_execute) === null || _b === void 0 ? void 0 : _b.id).is.not.undefined();
            const { item } = await commandDispatcherClient.awaitItem();
            assertthat_1.assert.that(item.id).is.equalTo(result.data.command.sampleContext_sampleAggregate_execute.id);
        });
        test('has a subscription endpoint for domain events.', async () => {
            const subscriptionClient = new subscriptions_transport_ws_1.SubscriptionClient(`ws+unix://${socket}:/graphql/v2/`, {}, ws_1.default);
            const link = new apollo_link_ws_1.WebSocketLink(subscriptionClient);
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            const client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
            const query = graphql_tag_1.default `
        subscription {
          domainEvents {
            id
          }
        }
      `;
            const observable = client.subscribe({
                query
            });
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
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            observable.subscribe(async () => {
                await collector.signal();
            });
            await sleep_1.sleep({ ms: 100 });
            await publishMessageClient.postMessage({
                channel: subscribeMessagesChannel,
                message: domainEvent
            });
            await collector.promise;
        });
        test('has a subscription endpoint for notifications.', async () => {
            const subscriptionClient = new subscriptions_transport_ws_1.SubscriptionClient(`ws+unix://${socket}:/graphql/v2/`, {}, ws_1.default);
            const link = new apollo_link_ws_1.WebSocketLink(subscriptionClient);
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            const client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
            const query = graphql_tag_1.default `
        subscription {
          notifications {
            name
          }
        }
      `;
            const observable = client.subscribe({
                query
            });
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            observable.subscribe(async () => {
                await collector.signal();
            });
            await sleep_1.sleep({ ms: 100 });
            await publishMessageClient.postMessage({
                channel: subscribeNotificationsChannel,
                message: { name: 'flowSampleFlowUpdated', data: '{}' }
            });
            await collector.promise;
        });
        test('has a query view endpoint.', async () => {
            var _a;
            const link = new apollo_link_http_1.HttpLink({
                uri: `http://localhost/graphql/v2`,
                fetch: node_fetch_1.default,
                fetchOptions: { agent }
            });
            const cache = new apollo_cache_inmemory_1.InMemoryCache();
            const client = new apollo_client_1.ApolloClient({
                link,
                cache
            });
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
            const result = await client.query({
                query,
                variables: {
                    aggregateId: uuid_1.v4(),
                    data: {
                        strategy: 'succeed'
                    }
                }
            });
            assertthat_1.assert.that((_a = result.data) === null || _a === void 0 ? void 0 : _a.sampleView.all).is.equalTo([]);
        });
    });
});
//# sourceMappingURL=processTests.js.map