"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../../lib/common/utils/test/buildDomainEvent");
const DomainEvent_1 = require("../../../../../lib/common/elements/DomainEvent");
const Client_1 = require("../../../../../lib/apis/awaitItem/http/v2/Client");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/configurationDefinition");
const configurationDefinition_2 = require("../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const Client_2 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const Client_3 = require("../../../../../lib/apis/performReplay/http/v2/Client");
const configurationDefinition_3 = require("../../../../../lib/runtimes/microservice/processes/replay/configurationDefinition");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
const Client_4 = require("../../../../../lib/apis/writeDomainEventStore/http/v2/Client");
suite('replay process', function () {
    this.timeout(60000);
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base', language: 'javascript' });
    const queueLockExpirationTime = 600, queuePollInterval = 600;
    let domainEventDispatcherClient, domainEventDispatcherHealthSocket, domainEventDispatcherSocket, domainEventStoreHealthSocket, domainEventStoreSocket, replayClient, replayHealthSocket, replaySocket, stopDomainEventDispatcherProcess, stopDomainEventStoreProcess, stopReplayProcess, writeDomainEventStoreClient;
    setup(async () => {
        [
            domainEventDispatcherSocket,
            domainEventDispatcherHealthSocket,
            domainEventStoreSocket,
            domainEventStoreHealthSocket,
            replayHealthSocket,
            replaySocket
        ] = await getSocketPaths_1.getSocketPaths({ count: 6 });
        const domainEventDispatcherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
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
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        domainEventDispatcherClient = new Client_1.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: domainEventDispatcherSocket,
            path: '/await-domain-event/v2',
            createItemInstance: ({ item }) => new DomainEvent_1.DomainEvent(item)
        });
        const domainEventStoreConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_2.configurationDefinition }),
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
                configurationDefinition: configurationDefinition_2.configurationDefinition
            })
        });
        writeDomainEventStoreClient = new Client_4.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: domainEventStoreSocket,
            path: '/write/v2'
        });
        const replayConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_3.configurationDefinition }),
            applicationDirectory,
            domainEventDispatcherHostName: 'localhost',
            domainEventDispatcherPortOrSocket: domainEventDispatcherSocket,
            aeonstoreHostName: 'localhost',
            aeonstorePortOrSocket: domainEventStoreSocket,
            portOrSocket: replaySocket,
            healthPortOrSocket: replayHealthSocket
        };
        stopReplayProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'replay',
            enableDebugMode: false,
            portOrSocket: replayHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: replayConfiguration,
                configurationDefinition: configurationDefinition_3.configurationDefinition
            })
        });
        replayClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: replaySocket,
            path: '/perform-replay/v2'
        });
    });
    teardown(async () => {
        if (stopDomainEventDispatcherProcess) {
            await stopDomainEventDispatcherProcess();
        }
        if (stopDomainEventStoreProcess) {
            await stopDomainEventStoreProcess();
        }
        if (stopReplayProcess) {
            await stopReplayProcess();
        }
        stopDomainEventDispatcherProcess = undefined;
        stopDomainEventStoreProcess = undefined;
        stopReplayProcess = undefined;
    });
    suite('getHealth', () => {
        test('is using the health API.', async () => {
            const healthClient = new Client_2.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: replayHealthSocket,
                path: '/health/v2'
            });
            await assertthat_1.assert.that(async () => healthClient.getHealth()).is.not.throwingAsync();
        });
    });
    suite('performing replay', () => {
        test('dispatches domain events for the requested aggregate.', async () => {
            const aggregateId = uuid_1.v4();
            await writeDomainEventStoreClient.storeDomainEvents({
                domainEvents: [
                    buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: aggregateId }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: { revision: 1 }
                    }),
                    buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: aggregateId }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: { revision: 2 }
                    }),
                    buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: aggregateId }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: { revision: 3 }
                    }),
                    buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: aggregateId }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: { revision: 4 }
                    })
                ]
            });
            await replayClient.performReplay({
                aggregates: [{
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: aggregateId }
                        },
                        from: 2,
                        to: 3
                    }]
            });
            let { item, metadata: { discriminator, token } } = await domainEventDispatcherClient.awaitItem();
            assertthat_1.assert.that(item.metadata.revision).is.equalTo(2);
            assertthat_1.assert.that(discriminator).is.equalTo('sampleFlow');
            await domainEventDispatcherClient.acknowledge({ discriminator, token });
            ({ item, metadata: { discriminator, token } } = await domainEventDispatcherClient.awaitItem());
            assertthat_1.assert.that(item.metadata.revision).is.equalTo(3);
            assertthat_1.assert.that(discriminator).is.equalTo('sampleFlow');
            await domainEventDispatcherClient.acknowledge({ discriminator, token });
        });
    });
});
//# sourceMappingURL=processTests.js.map