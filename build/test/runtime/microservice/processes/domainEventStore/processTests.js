"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../../lib/common/utils/test/buildDomainEvent");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const Client_1 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const Client_2 = require("../../../../../lib/apis/queryDomainEventStore/http/v2/Client");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
const Client_3 = require("../../../../../lib/apis/writeDomainEventStore/http/v2/Client");
suite('domain event store process', function () {
    this.timeout(60000);
    let healthSocket, queryDomainEventStoreClient, socket, stopProcess, writeDomainEventStoreClient;
    setup(async () => {
        [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
        const domainEventStoreConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            portOrSocket: socket,
            healthPortOrSocket: healthSocket
        };
        stopProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'domainEventStore',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: domainEventStoreConfiguration,
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        queryDomainEventStoreClient = new Client_2.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/query/v2'
        });
        writeDomainEventStoreClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/write/v2'
        });
    });
    teardown(async () => {
        if (stopProcess) {
            await stopProcess();
        }
        stopProcess = undefined;
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
    suite('getReplay', () => {
        test('streams all previously stored domain events.', async () => {
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                },
                name: 'execute',
                data: {},
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await writeDomainEventStoreClient.storeDomainEvents({ domainEvents: [domainEvent] });
            const eventReplay = await queryDomainEventStoreClient.getReplay({});
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            eventReplay.pipe(asJsonStream_1.asJsonStream([
                async (currentDomainEvent) => {
                    assertthat_1.assert.that(currentDomainEvent).is.equalTo(domainEvent);
                    await collector.signal();
                }
            ], true));
            await collector.promise;
        });
    });
    suite('getReplayForAggregate', () => {
        test('streams only domain events for the requested aggregate.', async () => {
            const wrongDomainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                },
                name: 'execute',
                data: {},
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            const aggregateId = uuid_1.v4();
            const rightDomainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'execute',
                data: {},
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await writeDomainEventStoreClient.storeDomainEvents({ domainEvents: [wrongDomainEvent, rightDomainEvent] });
            const eventReplay = await queryDomainEventStoreClient.getReplayForAggregate({ aggregateId });
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            eventReplay.pipe(asJsonStream_1.asJsonStream([
                async (currentDomainEvent) => {
                    assertthat_1.assert.that(currentDomainEvent).is.equalTo(rightDomainEvent);
                    await collector.signal();
                }
            ], true));
            await collector.promise;
        });
    });
    suite('getLastDomainEvent', () => {
        test('returns the last stored domain event.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const firstDomainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'execute',
                data: {},
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            const secondDomainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'execute',
                data: {},
                metadata: {
                    revision: 2,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await writeDomainEventStoreClient.storeDomainEvents({ domainEvents: [firstDomainEvent, secondDomainEvent] });
            const lastDomainEvent = await queryDomainEventStoreClient.getLastDomainEvent({ aggregateIdentifier });
            assertthat_1.assert.that(lastDomainEvent).is.equalTo(secondDomainEvent);
        });
    });
    suite('getSnapshot', () => {
        test('returns the previously stored snapshot.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const snapshot = {
                aggregateIdentifier,
                revision: 1,
                state: {}
            };
            await writeDomainEventStoreClient.storeSnapshot({ snapshot });
            const lastSnapshot = await queryDomainEventStoreClient.getSnapshot({ aggregateIdentifier });
            assertthat_1.assert.that(lastSnapshot).is.equalTo(snapshot);
        });
    });
});
//# sourceMappingURL=processTests.js.map