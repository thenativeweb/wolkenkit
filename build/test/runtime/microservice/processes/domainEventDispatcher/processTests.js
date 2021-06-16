"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const Client_1 = require("../../../../../lib/apis/awaitItem/http/v2/Client");
const buildDomainEvent_1 = require("../../../../../lib/common/utils/test/buildDomainEvent");
const DomainEvent_1 = require("../../../../../lib/common/elements/DomainEvent");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/domainEventDispatcher/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const Client_2 = require("../../../../../lib/apis/handleDomainEvent/http/v2/Client");
const Client_3 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
suite('domain event dispatcher process', function () {
    this.timeout(60000);
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const queueLockExpirationTime = 600;
    let awaitDomainEventClient, domainEventDispatcherHealthSocket, domainEventDispatcherSocket, handleDomainEventClient, stopProcessDomainEventDispatcher, stopProcessPublisher;
    setup(async () => {
        [domainEventDispatcherSocket, domainEventDispatcherHealthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
        const domainEventDispatcherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            applicationDirectory,
            priorityQueueStoreOptions: { type: 'InMemory', expirationTime: queueLockExpirationTime },
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
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        awaitDomainEventClient = new Client_1.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: domainEventDispatcherSocket,
            path: '/await-domain-event/v2',
            createItemInstance: ({ item }) => new DomainEvent_1.DomainEvent(item)
        });
        handleDomainEventClient = new Client_2.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: domainEventDispatcherSocket,
            path: '/handle-domain-event/v2'
        });
    });
    teardown(async () => {
        if (stopProcessDomainEventDispatcher) {
            await stopProcessDomainEventDispatcher();
        }
        if (stopProcessPublisher) {
            await stopProcessPublisher();
        }
        stopProcessPublisher = undefined;
        stopProcessDomainEventDispatcher = undefined;
    });
    suite('getHealth', () => {
        test('is using the health API.', async () => {
            const healthClient = new Client_3.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: domainEventDispatcherHealthSocket,
                path: '/health/v2'
            });
            await assertthat_1.assert.that(async () => healthClient.getHealth()).is.not.throwingAsync();
        });
    });
    suite('awaitDomainEvent', () => {
        test('delivers a domain event that is sent using the handle route.', async () => {
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                },
                name: 'executed',
                data: { strategy: 'succeed' },
                metadata: {
                    revision: 1
                }
            });
            await handleDomainEventClient.postDomainEvent({ domainEvent });
            const lock = await awaitDomainEventClient.awaitItem();
            assertthat_1.assert.that(lock.item).is.equalTo(domainEvent);
        });
        test('delivers an incoming domain event to a waiting client instantly.', async () => {
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                },
                name: 'executed',
                data: { strategy: 'succeed' },
                metadata: {
                    revision: 1
                }
            });
            const domainEventPromise = awaitDomainEventClient.awaitItem();
            const currentTime = Date.now();
            await handleDomainEventClient.postDomainEvent({ domainEvent });
            await domainEventPromise;
            const timeElapsed = Date.now() - currentTime;
            assertthat_1.assert.that(timeElapsed).is.lessThan(1000);
        });
    });
});
//# sourceMappingURL=processTests.js.map