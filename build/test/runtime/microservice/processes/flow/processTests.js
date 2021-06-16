"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("../../../../../lib/apis/writeDomainEventStore/http/v2/Client");
const asJsonStream_1 = require("../../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../../lib/common/utils/test/buildDomainEvent");
const Client_2 = require("../../../../../lib/apis/awaitItem/http/v2/Client");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition");
const CommandWithMetadata_1 = require("../../../../../lib/common/elements/CommandWithMetadata");
const configurationDefinition_2 = require("../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/configurationDefinition");
const configurationDefinition_3 = require("../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition");
const configurationDefinition_4 = require("../../../../../lib/runtimes/microservice/processes/flow/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const Client_3 = require("../../../../../lib/apis/handleDomainEvent/http/v2/Client");
const Client_4 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const configurationDefinition_5 = require("../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition");
const configurationDefinition_6 = require("../../../../../lib/runtimes/microservice/processes/replay/configurationDefinition");
const sleep_1 = require("../../../../../lib/common/utils/sleep");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const Client_5 = require("../../../../../lib/apis/subscribeMessages/http/v2/Client");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
suite('flow process', function () {
    this.timeout(60000);
    const pubsubChannelForNotifications = 'notification';
    let aeonstoreClient, aeonstoreHealthSocket, aeonstoreSocket, applicationDirectory, commandDispatcherClient, commandDispatcherHealthSocket, commandDispatcherSocket, domainEventDispatcherHealthSocket, domainEventDispatcherSocket, handleDomainEventClient, healthSocket, publisherHealthSocket, publisherSocket, replayHealthSocket, replaySocket, stopProcess, stopProcessAeonstore, stopProcessCommandDispatcher, stopProcessDomainEventDispatcher, stopProcessPublisher, stopReplayServer, subscribeMessagesClient;
    setup(async () => {
        applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withComplexFlow', language: 'javascript' });
        [
            healthSocket,
            commandDispatcherSocket,
            commandDispatcherHealthSocket,
            domainEventDispatcherSocket,
            domainEventDispatcherHealthSocket,
            replaySocket,
            replayHealthSocket,
            aeonstoreSocket,
            aeonstoreHealthSocket,
            publisherSocket,
            publisherHealthSocket
        ] = await getSocketPaths_1.getSocketPaths({ count: 11 });
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
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: commandDispatcherSocket,
            path: '/await-command/v2',
            createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
        });
        const domainEventDispatcherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_2.configurationDefinition }),
            applicationDirectory,
            priorityQueueStoreOptions: { type: 'InMemory', expirationTime: 5000 },
            portOrSocket: domainEventDispatcherSocket,
            healthPortOrSocket: domainEventDispatcherHealthSocket
        };
        stopProcessDomainEventDispatcher = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'domainEventDispatcher',
            enableDebugMode: false,
            portOrSocket: domainEventDispatcherHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: domainEventDispatcherConfiguration,
                configurationDefinition: configurationDefinition_2.configurationDefinition
            })
        });
        handleDomainEventClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: domainEventDispatcherSocket,
            path: '/handle-domain-event/v2'
        });
        const replayConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_6.configurationDefinition }),
            applicationDirectory,
            domainEventDispatcherHostName: 'localhost',
            domainEventDispatcherPortOrSocket: domainEventDispatcherSocket,
            aeonstoreHostName: 'localhost',
            aeonstorePortOrSocket: aeonstoreSocket,
            portOrSocket: replaySocket,
            healthPortOrSocket: replayHealthSocket
        };
        stopReplayServer = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'replay',
            enableDebugMode: false,
            portOrSocket: replayHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: replayConfiguration,
                configurationDefinition: configurationDefinition_6.configurationDefinition
            })
        });
        const domainEventStoreConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_3.configurationDefinition }),
            portOrSocket: aeonstoreSocket,
            healthPortOrSocket: aeonstoreHealthSocket
        };
        stopProcessAeonstore = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'domainEventStore',
            enableDebugMode: false,
            portOrSocket: aeonstoreHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: domainEventStoreConfiguration,
                configurationDefinition: configurationDefinition_3.configurationDefinition
            })
        });
        aeonstoreClient = new Client_1.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: aeonstoreSocket,
            path: '/write/v2'
        });
        const publisherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_5.configurationDefinition }),
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
                configurationDefinition: configurationDefinition_5.configurationDefinition
            })
        });
        subscribeMessagesClient = new Client_5.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: publisherSocket,
            path: '/subscribe/v2'
        });
        const flowConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_4.configurationDefinition }),
            applicationDirectory,
            domainEventDispatcherHostName: 'localhost',
            domainEventDispatcherPortOrSocket: domainEventDispatcherSocket,
            domainEventDispatcherRenewInterval: 5000,
            domainEventDispatcherAcknowledgeRetries: 5,
            commandDispatcherHostName: 'localhost',
            commandDispatcherPortOrSocket: commandDispatcherSocket,
            replayServerHostName: 'localhost',
            replayServerPortOrSocket: replaySocket,
            aeonstoreHostName: 'localhost',
            aeonstorePortOrSocket: aeonstoreSocket,
            lockStoreOptions: { type: 'InMemory' },
            consumerProgressStoreOptions: { type: 'InMemory' },
            healthPortOrSocket: healthSocket,
            concurrentFlows: 1,
            pubSubOptions: {
                channelForNotifications: pubsubChannelForNotifications,
                publisher: {
                    type: 'Http',
                    protocol: 'http',
                    hostName: 'localhost',
                    portOrSocket: publisherSocket,
                    path: '/publish/v2'
                }
            }
        };
        stopProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'flow',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: flowConfiguration,
                configurationDefinition: configurationDefinition_4.configurationDefinition
            })
        });
    });
    teardown(async () => {
        if (stopProcess) {
            await stopProcess();
        }
        if (stopProcessPublisher) {
            await stopProcessPublisher();
        }
        if (stopProcessAeonstore) {
            await stopProcessAeonstore();
        }
        if (stopReplayServer) {
            await stopReplayServer();
        }
        if (stopProcessDomainEventDispatcher) {
            await stopProcessDomainEventDispatcher();
        }
        if (stopProcessCommandDispatcher) {
            await stopProcessCommandDispatcher();
        }
        stopProcess = undefined;
        stopProcessPublisher = undefined;
        stopProcessAeonstore = undefined;
        stopReplayServer = undefined;
        stopProcessCommandDispatcher = undefined;
        stopProcessDomainEventDispatcher = undefined;
    });
    suite('getHealth', () => {
        test('is using the health API.', async () => {
            const healthClient = new Client_4.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: healthSocket,
                path: '/health/v2'
            });
            await assertthat_1.assert.that(async () => healthClient.getHealth()).is.not.throwingAsync();
        });
    });
    suite('executes flow', () => {
        test('for a domain received via the domain event dispatcher.', async () => {
            const aggregateId = uuid_1.v4();
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'triggeredFlow',
                data: { flowName: 'neverFlow' },
                metadata: { revision: 1 }
            });
            await aeonstoreClient.storeDomainEvents({ domainEvents: [domainEvent] });
            await handleDomainEventClient.postDomainEvent({ domainEvent });
            await sleep_1.sleep({ ms: 1500 });
            const lock = await commandDispatcherClient.awaitItem();
            assertthat_1.assert.that(lock).is.not.undefined();
            assertthat_1.assert.that(lock.item).is.atLeast({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'executeFromFlow',
                data: { fromFlow: 'neverFlow' }
            });
        });
        test('with replay.', async () => {
            const aggregateId = uuid_1.v4();
            const domainEvents = [
                buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: aggregateId }
                    },
                    name: 'triggeredFlow',
                    data: { flowName: 'alwaysFlow' },
                    metadata: { revision: 1 }
                }),
                buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: aggregateId }
                    },
                    name: 'triggeredFlow',
                    data: { flowName: 'alwaysFlow' },
                    metadata: { revision: 2 }
                }),
                buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: aggregateId }
                    },
                    name: 'triggeredFlow',
                    data: { flowName: 'alwaysFlow' },
                    metadata: { revision: 3 }
                })
            ];
            await aeonstoreClient.storeDomainEvents({ domainEvents });
            await handleDomainEventClient.postDomainEvent({ domainEvent: domainEvents[2] });
            await sleep_1.sleep({ ms: 1500 });
            let lock = await commandDispatcherClient.awaitItem();
            assertthat_1.assert.that(lock).is.not.undefined();
            assertthat_1.assert.that(lock.item).is.atLeast({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'executeFromFlow',
                data: { basedOnRevision: 1, fromFlow: 'alwaysFlow' }
            });
            await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });
            lock = await commandDispatcherClient.awaitItem();
            assertthat_1.assert.that(lock).is.not.undefined();
            assertthat_1.assert.that(lock.item).is.atLeast({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'executeFromFlow',
                data: { basedOnRevision: 2, fromFlow: 'alwaysFlow' }
            });
            await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });
            lock = await commandDispatcherClient.awaitItem();
            assertthat_1.assert.that(lock).is.not.undefined();
            assertthat_1.assert.that(lock.item).is.atLeast({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'executeFromFlow',
                data: { basedOnRevision: 3, fromFlow: 'alwaysFlow' }
            });
            await commandDispatcherClient.acknowledge({ discriminator: lock.metadata.discriminator, token: lock.metadata.token });
        });
        test('publishes notifications.', async () => {
            const aggregateId = uuid_1.v4();
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'executed',
                data: { strategy: 'succeed' },
                metadata: { revision: 1 }
            });
            const messageStreamNotification = await subscribeMessagesClient.getMessages({
                channel: pubsubChannelForNotifications
            });
            await aeonstoreClient.storeDomainEvents({ domainEvents: [domainEvent] });
            await handleDomainEventClient.postDomainEvent({ domainEvent });
            await new Promise((resolve, reject) => {
                messageStreamNotification.on('error', (err) => {
                    reject(err);
                });
                messageStreamNotification.on('close', () => {
                    resolve();
                });
                messageStreamNotification.pipe(asJsonStream_1.asJsonStream([
                    (data) => {
                        try {
                            assertthat_1.assert.that(data).is.atLeast({
                                name: 'flowSampleFlowUpdated',
                                data: {}
                            });
                            resolve();
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    }
                ], true));
            });
        });
    });
});
//# sourceMappingURL=processTests.js.map