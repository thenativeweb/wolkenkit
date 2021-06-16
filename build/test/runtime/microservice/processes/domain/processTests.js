"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const Client_1 = require("../../../../../lib/apis/awaitItem/http/v2/Client");
const buildCommandWithMetadata_1 = require("../../../../../lib/common/utils/test/buildCommandWithMetadata");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition");
const configurationDefinition_2 = require("../../../../../lib/runtimes/microservice/processes/domain/configurationDefinition");
const DomainEvent_1 = require("../../../../../lib/common/elements/DomainEvent");
const configurationDefinition_3 = require("../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/configurationDefinition");
const configurationDefinition_4 = require("../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const Client_2 = require("../../../../../lib/apis/handleCommandWithMetadata/http/v2/Client");
const Client_3 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const configurationDefinition_5 = require("../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition");
const Client_4 = require("../../../../../lib/apis/queryDomainEventStore/http/v2/Client");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const Client_5 = require("../../../../../lib/apis/subscribeMessages/http/v2/Client");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
suite('domain process', function () {
    this.timeout(60000);
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const publisherChannelNewDomainEvent = 'new-domain-event', publisherChannelNotification = 'notifications', queueLockExpirationTime = 600, queuePollInterval = 600;
    let commandDispatcherHealthSocket, commandDispatcherSocket, domainEventDispatcherHealthSocket, domainEventDispatcherSocket, domainEventStoreHealthSocket, domainEventStoreSocket, domainHealthSocket, handleCommandWithMetadataClient, publisherHealthSocket, publisherSocket, queryDomainEventStoreClient, stopCommandDispatcherProcess, stopDomainEventDispatcherProcess, stopDomainEventStoreProcess, stopDomainProcess, stopPublisherProcess, subscribeMessagesClient;
    setup(async () => {
        [
            commandDispatcherSocket,
            commandDispatcherHealthSocket,
            domainEventDispatcherSocket,
            domainEventDispatcherHealthSocket,
            domainEventStoreSocket,
            domainEventStoreHealthSocket,
            domainHealthSocket,
            publisherSocket,
            publisherHealthSocket
        ] = await getSocketPaths_1.getSocketPaths({ count: 9 });
        const commandDispatcherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            applicationDirectory,
            priorityQueueStoreOptions: { type: 'InMemory', expirationTime: queueLockExpirationTime },
            portOrSocket: commandDispatcherSocket,
            healthPortOrSocket: commandDispatcherHealthSocket,
            missedCommandRecoveryInterval: queuePollInterval
        };
        stopCommandDispatcherProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'commandDispatcher',
            enableDebugMode: false,
            portOrSocket: commandDispatcherHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: commandDispatcherConfiguration,
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        handleCommandWithMetadataClient = new Client_2.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: commandDispatcherSocket,
            path: '/handle-command/v2'
        });
        const domainEventDispatcherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_3.configurationDefinition }),
            applicationDirectory,
            priorityQueueStoreOptions: { type: 'InMemory', expirationTime: queueLockExpirationTime },
            portOrSocket: domainEventDispatcherSocket,
            healthPortOrSocket: domainEventDispatcherHealthSocket,
            missedDomainEventRecoveryInterval: queuePollInterval
        };
        stopDomainEventDispatcherProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'domainEventDispatcher',
            enableDebugMode: false,
            portOrSocket: domainEventDispatcherHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: domainEventDispatcherConfiguration,
                configurationDefinition: configurationDefinition_3.configurationDefinition
            })
        });
        const domainEventStoreConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_4.configurationDefinition }),
            portOrSocket: domainEventStoreSocket,
            healthPortOrSocket: domainEventStoreHealthSocket
        };
        stopDomainEventStoreProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'domainEventStore',
            enableDebugMode: false,
            portOrSocket: domainEventStoreHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: domainEventStoreConfiguration,
                configurationDefinition: configurationDefinition_4.configurationDefinition
            })
        });
        queryDomainEventStoreClient = new Client_4.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: domainEventStoreSocket,
            path: '/query/v2'
        });
        const publisherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_5.configurationDefinition }),
            portOrSocket: publisherSocket,
            healthPortOrSocket: publisherHealthSocket
        };
        stopPublisherProcess = await startProcess_1.startProcess({
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
        const domainConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_2.configurationDefinition }),
            applicationDirectory,
            commandDispatcherHostName: 'localhost',
            commandDispatcherPortOrSocket: commandDispatcherSocket,
            commandDispatcherRenewInterval: 5000,
            commandDispatcherAcknowledgeRetries: 0,
            domainEventDispatcherHostName: 'localhost',
            domainEventDispatcherPortOrSocket: domainEventDispatcherSocket,
            pubSubOptions: {
                channelForNotifications: publisherChannelNotification,
                channelForNewDomainEvents: publisherChannelNewDomainEvent,
                publisher: {
                    type: 'Http',
                    protocol: 'http',
                    hostName: 'localhost',
                    portOrSocket: publisherSocket,
                    path: '/publish/v2'
                }
            },
            aeonstoreHostName: 'localhost',
            aeonstorePortOrSocket: domainEventStoreSocket,
            healthPortOrSocket: domainHealthSocket,
            concurrentCommands: 1,
            snapshotStrategy: { name: 'never' }
        };
        stopDomainProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'domain',
            enableDebugMode: false,
            portOrSocket: domainHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: domainConfiguration,
                configurationDefinition: configurationDefinition_2.configurationDefinition
            })
        });
    });
    teardown(async () => {
        if (stopCommandDispatcherProcess) {
            await stopCommandDispatcherProcess();
        }
        if (stopDomainEventDispatcherProcess) {
            await stopDomainEventDispatcherProcess();
        }
        if (stopDomainEventStoreProcess) {
            await stopDomainEventStoreProcess();
        }
        if (stopPublisherProcess) {
            await stopPublisherProcess();
        }
        if (stopDomainProcess) {
            await stopDomainProcess();
        }
        stopCommandDispatcherProcess = undefined;
        stopDomainEventDispatcherProcess = undefined;
        stopDomainEventStoreProcess = undefined;
        stopPublisherProcess = undefined;
        stopDomainProcess = undefined;
    });
    suite('getHealth', () => {
        test('is using the health API.', async () => {
            const healthClient = new Client_3.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: domainHealthSocket,
                path: '/health/v2'
            });
            await assertthat_1.assert.that(async () => healthClient.getHealth()).is.not.throwingAsync();
        });
    });
    suite('authorization', () => {
        test(`publishes (and does not store) a rejected event if the sender of a command is not authorized.`, async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier,
                name: 'authorize',
                data: {
                    shouldAuthorize: false
                }
            });
            const messageStream = await subscribeMessagesClient.getMessages({
                channel: publisherChannelNewDomainEvent
            });
            await handleCommandWithMetadataClient.postCommand({ command });
            await new Promise((resolve, reject) => {
                messageStream.on('error', (err) => {
                    reject(err);
                });
                messageStream.on('close', () => {
                    resolve();
                });
                messageStream.pipe(asJsonStream_1.asJsonStream([
                    (data) => {
                        try {
                            assertthat_1.assert.that(data).is.atLeast({
                                aggregateIdentifier,
                                name: 'authorizeRejected',
                                data: {
                                    reason: 'Command not authorized.'
                                }
                            });
                            resolve();
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    },
                    () => {
                        reject(new Error('Should only have received one message.'));
                    }
                ], true));
            });
            assertthat_1.assert.that(await queryDomainEventStoreClient.getLastDomainEvent({ aggregateIdentifier })).is.undefined();
        });
    });
    suite('handling', () => {
        test('publishes (and stores) an appropriate event for the incoming command.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier,
                name: 'execute',
                data: {
                    strategy: 'succeed'
                }
            });
            const messageStreamNewDomainEvent = await subscribeMessagesClient.getMessages({
                channel: publisherChannelNewDomainEvent
            });
            await handleCommandWithMetadataClient.postCommand({ command });
            await new Promise((resolve, reject) => {
                messageStreamNewDomainEvent.on('error', (err) => {
                    reject(err);
                });
                messageStreamNewDomainEvent.on('close', () => {
                    resolve();
                });
                messageStreamNewDomainEvent.pipe(asJsonStream_1.asJsonStream([
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
                        reject(new Error('Should only have received two messages.'));
                    }
                ], true));
            });
            const awaitDomainEventClient = new Client_1.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: domainEventDispatcherSocket,
                path: '/await-domain-event/v2',
                createItemInstance: ({ item }) => new DomainEvent_1.DomainEvent(item)
            });
            let { item, metadata } = await awaitDomainEventClient.awaitItem();
            assertthat_1.assert.that(item).is.atLeast({
                aggregateIdentifier,
                name: 'succeeded',
                data: {}
            });
            await awaitDomainEventClient.acknowledge({
                discriminator: metadata.discriminator,
                token: metadata.token
            });
            ({ item, metadata } = await awaitDomainEventClient.awaitItem());
            assertthat_1.assert.that(item).is.atLeast({
                aggregateIdentifier,
                name: 'executed',
                data: {
                    strategy: 'succeed'
                }
            });
            await awaitDomainEventClient.acknowledge({
                discriminator: metadata.discriminator,
                token: metadata.token
            });
            const eventStream = await queryDomainEventStoreClient.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });
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
                        reject(new Error('Should only have received two messages.'));
                    }
                ], true));
            });
        });
        test('handles multiple events in independent aggregates after each other.', async () => {
            const command1 = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                data: {
                    strategy: 'succeed'
                }
            });
            const command2 = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                data: {
                    strategy: 'succeed'
                }
            });
            const messageStream = await subscribeMessagesClient.getMessages({
                channel: publisherChannelNewDomainEvent
            });
            await handleCommandWithMetadataClient.postCommand({ command: command1 });
            await handleCommandWithMetadataClient.postCommand({ command: command2 });
            const counter = wait_for_signals_1.waitForSignals({ count: 4 });
            messageStream.on('error', async (err) => {
                await counter.fail(err);
            });
            messageStream.pipe(asJsonStream_1.asJsonStream([
                async (data) => {
                    try {
                        assertthat_1.assert.that(data).is.atLeast({
                            aggregateIdentifier: command1.aggregateIdentifier,
                            name: 'succeeded',
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
                            aggregateIdentifier: command1.aggregateIdentifier,
                            name: 'executed',
                            data: {
                                strategy: 'succeed'
                            }
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
                            aggregateIdentifier: command2.aggregateIdentifier,
                            name: 'succeeded',
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
                            aggregateIdentifier: command2.aggregateIdentifier,
                            name: 'executed',
                            data: {
                                strategy: 'succeed'
                            }
                        });
                        await counter.signal();
                    }
                    catch (ex) {
                        await counter.fail(ex);
                    }
                },
                async () => {
                    await counter.fail(new Error('Should only have received four messages.'));
                }
            ], true));
            await counter.promise;
        });
        test('publishes notifications from command handlers.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier,
                name: 'execute',
                data: {
                    strategy: 'succeed'
                }
            });
            const messageStreamNotification = await subscribeMessagesClient.getMessages({
                channel: publisherChannelNotification
            });
            await handleCommandWithMetadataClient.postCommand({ command });
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
                                name: 'commandExecute',
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