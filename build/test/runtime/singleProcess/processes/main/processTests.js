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
const http_1 = require("http");
const apollo_client_1 = require("apollo-client");
const asJsonStream_1 = require("../../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const buildCommand_1 = require("../../../../../lib/common/utils/test/buildCommand");
const configurationDefinition_1 = require("../../../../../lib/runtimes/singleProcess/processes/main/configurationDefinition");
const node_fetch_1 = __importDefault(require("node-fetch"));
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const Client_1 = require("../../../../../lib/apis/handleCommand/http/v2/Client");
const Client_2 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const apollo_link_http_1 = require("apollo-link-http");
const Client_3 = require("../../../../../lib/apis/manageFile/http/v2/Client");
const Client_4 = require("../../../../../lib/apis/observeDomainEvents/http/v2/Client");
const path_1 = __importDefault(require("path"));
const Client_5 = require("../../../../../lib/apis/queryView/http/v2/Client");
const stream_1 = require("stream");
const sleep_1 = require("../../../../../lib/common/utils/sleep");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const stream_to_string_1 = __importDefault(require("stream-to-string"));
const Client_6 = require("../../../../../lib/apis/subscribeNotifications/http/v2/Client");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
const apollo_link_ws_1 = require("apollo-link-ws");
const ws_1 = __importDefault(require("ws"));
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const errors = __importStar(require("../../../../../lib/common/errors"));
const certificateDirectory = path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');
suite('main process', function () {
    this.timeout(60000);
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withComplexFlow', language: 'javascript' });
    let agent, handleCommandClient, healthSocket, manageFileClient, observeDomainEventsClient, queryViewsClient, socket, stopProcess;
    setup(async () => {
        [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
        const configuration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({
                configurationDefinition: configurationDefinition_1.configurationDefinition
            }),
            applicationDirectory,
            domainEventStoreOptions: { type: 'InMemory' },
            graphqlApi: { enableIntegratedClient: false },
            httpApi: true,
            identityProviders: [{ issuer: 'https://token.invalid', certificate: certificateDirectory }],
            portOrSocket: socket,
            healthPortOrSocket: healthSocket,
            snapshotStrategy: { name: 'never' }
        };
        stopProcess = await startProcess_1.startProcess({
            runtime: 'singleProcess',
            name: 'main',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration,
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        handleCommandClient = new Client_1.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/command/v2'
        });
        observeDomainEventsClient = new Client_4.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/domain-events/v2'
        });
        queryViewsClient = new Client_5.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/views/v2'
        });
        manageFileClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/files/v2'
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
        stopProcess = undefined;
    });
    suite('getHealth', () => {
        test('is using the health API.', async () => {
            const healthClient = new Client_2.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: healthSocket,
                path: '/health/v2'
            });
            await assertthat_1.assert.that(async () => await healthClient.getHealth()).is.not.throwingAsync();
        });
    });
    suite('command handling', () => {
        test('handles commands and publishes events.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const command = buildCommand_1.buildCommand({
                aggregateIdentifier,
                name: 'execute',
                data: {
                    strategy: 'succeed'
                }
            });
            const eventStream = await observeDomainEventsClient.getDomainEvents({});
            await handleCommandClient.postCommand({ command });
            await new Promise((resolve, reject) => {
                eventStream.on('error', (err) => {
                    reject(err);
                });
                eventStream.on('close', () => {
                    resolve();
                });
                eventStream.pipe(asJsonStream_1.asJsonStream([
                    (data) => {
                        try {
                            assertthat_1.assert.that(data).is.atLeast({
                                aggregateIdentifier,
                                name: 'succeeded',
                                data: {}
                            });
                            resolve();
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    },
                    (data) => {
                        try {
                            assertthat_1.assert.that(data).is.atLeast({
                                aggregateIdentifier,
                                name: 'executed',
                                data: {
                                    strategy: 'succeed'
                                }
                            });
                            resolve();
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    },
                    () => {
                        reject(new Error('Should only have received twe messages.'));
                    }
                ], true));
            });
        });
        test('executes flows.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const command = buildCommand_1.buildCommand({
                aggregateIdentifier,
                name: 'triggerFlow',
                data: {
                    flowNames: ['neverFlow']
                }
            });
            const eventStream = await observeDomainEventsClient.getDomainEvents({});
            await handleCommandClient.postCommand({ command });
            const counter = wait_for_signals_1.waitForSignals({ count: 2 });
            eventStream.on('error', async (err) => {
                await counter.fail(err);
            });
            eventStream.pipe(asJsonStream_1.asJsonStream([
                async (data) => {
                    try {
                        assertthat_1.assert.that(data).is.atLeast({
                            aggregateIdentifier,
                            name: 'triggeredFlow',
                            data: { flowName: 'neverFlow' }
                        });
                        await counter.signal();
                    }
                    catch (ex) {
                        await counter.fail(ex);
                    }
                },
                async (data) => {
                    try {
                        assertthat_1.assert.that(data).is.atLeast({
                            aggregateIdentifier,
                            name: 'executedFromFlow',
                            data: {
                                basedOnRevision: 1,
                                fromFlow: 'neverFlow'
                            }
                        });
                        await counter.signal();
                    }
                    catch (ex) {
                        await counter.fail(ex);
                    }
                },
                async () => {
                    await counter.fail(new Error('Should only have received two messages.'));
                }
            ], true));
            await counter.promise;
        });
    });
    suite('graphql', () => {
        test('has a command mutation endpoint.', async () => {
            var _a, _b;
            const link = new apollo_link_http_1.HttpLink({
                uri: `http://localhost/graphql/v2/`,
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
            const command = buildCommand_1.buildCommand({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'execute',
                data: { strategy: 'succeed' }
            });
            const collector = wait_for_signals_1.waitForSignals({ count: 2 });
            observable.subscribe(async () => {
                await collector.signal();
            });
            await sleep_1.sleep({ ms: 100 });
            await handleCommandClient.postCommand({ command });
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
            const aggregateId = uuid_1.v4();
            const command = buildCommand_1.buildCommand({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'execute',
                data: { strategy: 'succeed' }
            });
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            observable.subscribe(async () => {
                await collector.signal();
            });
            await sleep_1.sleep({ ms: 100 });
            await handleCommandClient.postCommand({ command });
            await collector.promise;
        });
    });
    suite('views', () => {
        test('runs queries against the views.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const command = buildCommand_1.buildCommand({
                aggregateIdentifier,
                name: 'execute',
                data: {
                    strategy: 'succeed'
                }
            });
            await handleCommandClient.postCommand({ command });
            await sleep_1.sleep({ ms: 500 });
            const resultStream = await queryViewsClient.queryStream({
                viewName: 'sampleView',
                queryName: 'all'
            });
            const resultItems = [];
            for await (const resultItem of resultStream) {
                resultItems.push(resultItem);
            }
            assertthat_1.assert.that(resultItems.length).is.equalTo(1);
            assertthat_1.assert.that(resultItems[0]).is.atLeast({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate' }
                },
                name: 'executed'
            });
        });
    });
    suite('files', () => {
        test('stores files.', async () => {
            const file = {
                id: uuid_1.v4(),
                name: uuid_1.v4(),
                content: 'Hello world!'
            };
            await manageFileClient.addFile({
                id: file.id,
                name: file.name,
                contentType: 'text/plain',
                stream: stream_1.Readable.from(file.content)
            });
            const { stream } = await manageFileClient.getFile({ id: file.id });
            const content = await stream_to_string_1.default(stream);
            assertthat_1.assert.that(content).is.equalTo(file.content);
        });
        test('removes files.', async () => {
            const file = {
                id: uuid_1.v4(),
                name: uuid_1.v4(),
                content: 'Hello world!'
            };
            await manageFileClient.addFile({
                id: file.id,
                name: file.name,
                contentType: 'text/plain',
                stream: stream_1.Readable.from(file.content)
            });
            await manageFileClient.removeFile({ id: file.id });
            await assertthat_1.assert.that(async () => {
                await manageFileClient.getFile({ id: file.id });
            }).is.throwingAsync((ex) => ex.code === errors.FileNotFound.code);
        });
    });
    suite('notifications', () => {
        test('publishes notifications via the api.', async () => {
            const notificationsClient = new Client_6.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: socket,
                path: '/notifications/v2'
            });
            const notificationStream = await notificationsClient.getNotifications();
            const counter = wait_for_signals_1.waitForSignals({ count: 2 });
            notificationStream.on('error', async (err) => {
                await counter.fail(err);
            });
            notificationStream.pipe(asJsonStream_1.asJsonStream([
                async (data) => {
                    try {
                        assertthat_1.assert.that(data).is.atLeast({
                            name: 'flowSampleFlowUpdated',
                            data: {}
                        });
                        await counter.signal();
                    }
                    catch (ex) {
                        await counter.fail(ex);
                    }
                },
                async (data) => {
                    try {
                        assertthat_1.assert.that(data).is.atLeast({
                            name: 'viewSampleViewUpdated',
                            data: {}
                        });
                        await counter.signal();
                    }
                    catch (ex) {
                        await counter.fail(ex);
                    }
                },
                async () => {
                    await counter.fail(new Error('Should only have received two messages.'));
                }
            ], true));
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const command = buildCommand_1.buildCommand({
                aggregateIdentifier,
                name: 'execute',
                data: {
                    strategy: 'succeed'
                }
            });
            await handleCommandClient.postCommand({ command });
            await counter.promise;
        });
    });
});
//# sourceMappingURL=processTests.js.map