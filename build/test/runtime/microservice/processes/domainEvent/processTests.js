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
const asJsonStream_1 = require("../../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../../lib/common/utils/test/buildDomainEvent");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/domainEvent/configurationDefinition");
const configurationDefinition_2 = require("../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition");
const DomainEventWithState_1 = require("../../../../../lib/common/elements/DomainEventWithState");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const Client_1 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const Client_2 = require("../../../../../lib/apis/observeDomainEvents/http/v2/Client");
const path_1 = __importDefault(require("path"));
const configurationDefinition_3 = require("../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition");
const Client_3 = require("../../../../../lib/apis/publishMessage/http/v2/Client");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../../lib/common/errors"));
const certificateDirectory = path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');
suite('domain event process', function () {
    this.timeout(60000);
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' }), pubSubChannelForNewDomainEvents = 'new-domain-event', pubSubChannelNotification = 'notification';
    let domainEventStoreHealthSocket, domainEventStoreSocket, healthSocket, observeDomainEventsClient, publisherHealthSocket, publisherSocket, publishMessageClient, socket, stopProcess, stopProcessDomainEventStore, stopProcessPublisher;
    setup(async function () {
        this.timeout(60000);
        [
            socket,
            healthSocket,
            publisherSocket,
            publisherHealthSocket,
            domainEventStoreSocket,
            domainEventStoreHealthSocket
        ] = await getSocketPaths_1.getSocketPaths({ count: 6 });
        const publisherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_3.configurationDefinition }),
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
                configurationDefinition: configurationDefinition_3.configurationDefinition
            })
        });
        publishMessageClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: publisherSocket,
            path: '/publish/v2'
        });
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
        const domainEventConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            aeonstoreHostName: 'localhost',
            aeonstorePortOrSocket: domainEventStoreSocket,
            applicationDirectory,
            portOrSocket: socket,
            healthPortOrSocket: healthSocket,
            identityProviders: [{ issuer: 'https://token.invalid', certificate: certificateDirectory }],
            pubSubOptions: {
                channelForNewDomainEvents: pubSubChannelForNewDomainEvents,
                channelForNotifications: pubSubChannelNotification,
                publisher: {
                    type: 'Http',
                    protocol: 'http',
                    hostName: 'localhost',
                    portOrSocket: publisherSocket,
                    path: '/publish/v2'
                },
                subscriber: {
                    type: 'Http',
                    protocol: 'http',
                    hostName: 'localhost',
                    portOrSocket: publisherSocket,
                    path: '/subscribe/v2'
                }
            },
            snapshotStrategy: { name: 'never' }
        };
        stopProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'domainEvent',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: domainEventConfiguration,
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        observeDomainEventsClient = new Client_2.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/domain-events/v2'
        });
    });
    teardown(async () => {
        if (stopProcess) {
            await stopProcess();
        }
        if (stopProcessPublisher) {
            await stopProcessPublisher();
        }
        if (stopProcessDomainEventStore) {
            await stopProcessDomainEventStore();
        }
        stopProcess = undefined;
        stopProcessPublisher = undefined;
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
            await assertthat_1.assert.that(async () => healthClient.getHealth()).is.not.throwingAsync();
        });
    });
    suite('getDomainEvents', () => {
        test('does not stream invalid domain events.', async () => {
            const domainEventWithoutState = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                },
                name: 'nonExistent',
                data: {},
                metadata: {
                    revision: 1,
                    initiator: { user: { id: uuid_1.v4(), claims: { sub: uuid_1.v4() } } }
                }
            });
            setTimeout(async () => {
                await publishMessageClient.postMessage({
                    channel: pubSubChannelForNewDomainEvents,
                    message: domainEventWithoutState
                });
            }, 50);
            const domainEventStream = await observeDomainEventsClient.getDomainEvents({});
            await new Promise(async (resolve, reject) => {
                try {
                    domainEventStream.pipe(asJsonStream_1.asJsonStream([
                        () => {
                            throw new errors.InvalidOperation();
                        }
                    ], true));
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }
                catch (ex) {
                    reject(ex);
                }
            });
        });
        test('streams domain events from the publisher.', async () => {
            const domainEvent = new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'executed',
                    data: { strategy: 'succeed' },
                    metadata: {
                        revision: 1,
                        initiator: { user: { id: uuid_1.v4(), claims: { sub: uuid_1.v4() } } }
                    }
                }),
                state: {
                    previous: {},
                    next: {}
                }
            });
            setTimeout(async () => {
                await publishMessageClient.postMessage({
                    channel: pubSubChannelForNewDomainEvents,
                    message: domainEvent
                });
            }, 50);
            await new Promise(async (resolve, reject) => {
                try {
                    const domainEventStream = await observeDomainEventsClient.getDomainEvents({});
                    domainEventStream.pipe(asJsonStream_1.asJsonStream([
                        (receivedEvent) => {
                            assertthat_1.assert.that(receivedEvent.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ], true));
                }
                catch (ex) {
                    reject(ex);
                }
            });
        });
    });
});
//# sourceMappingURL=processTests.js.map