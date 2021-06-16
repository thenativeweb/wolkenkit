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
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const createConsumerProgressStore_1 = require("../../../../lib/stores/consumerProgressStore/createConsumerProgressStore");
const createDomainEventStore_1 = require("../../../../lib/stores/domainEventStore/createDomainEventStore");
const createLockStore_1 = require("../../../../lib/stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const executeFlow_1 = require("../../../../lib/common/domain/executeFlow");
const getAggregatesService_1 = require("../../../../lib/common/services/getAggregatesService");
const getCommandService_1 = require("../../../../lib/common/services/getCommandService");
const getLockService_1 = require("../../../../lib/common/services/getLockService");
const getSnapshotStrategy_1 = require("../../../../lib/common/domain/getSnapshotStrategy");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const lodash_1 = require("lodash");
const Repository_1 = require("../../../../lib/common/domain/Repository");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
const issueCommandNoop = lodash_1.noop;
const performReplayNoop = async () => {
    // Intentionally left blank.
};
suite('executeFlow', () => {
    let aggregatesService, application, consumerProgressStore, domainEventStore, lockService, lockStore, loggedMessages, loggerService, notifications, notificationService, publisher, pubSubChannelForNotifications;
    setup(async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base', language: 'javascript' });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        domainEventStore = await createDomainEventStore_1.createDomainEventStore({ type: 'InMemory' });
        lockStore = await createLockStore_1.createLockStore({ type: 'InMemory' });
        consumerProgressStore = await createConsumerProgressStore_1.createConsumerProgressStore({ type: 'InMemory' });
        lockService = getLockService_1.getLockService({ lockStore });
        loggedMessages = [];
        loggerService = {
            debug(message, metadata) {
                loggedMessages.push({ level: 'debug', message, metadata });
            },
            info(message, metadata) {
                loggedMessages.push({ level: 'info', message, metadata });
            },
            warn(message, metadata) {
                loggedMessages.push({ level: 'warn', message, metadata });
            },
            error(message, metadata) {
                loggedMessages.push({ level: 'error', message, metadata });
            },
            fatal(message, metadata) {
                loggedMessages.push({ level: 'fatal', message, metadata });
            }
        };
        publisher = await createPublisher_1.createPublisher({ type: 'InMemory' });
        pubSubChannelForNotifications = 'notifications';
        notifications = [];
        notificationService = {
            publish(name, data, metadata) {
                notifications.push({ name, data, metadata });
            }
        };
        const repository = new Repository_1.Repository({
            application,
            domainEventStore,
            lockStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            publisher,
            pubSubChannelForNotifications
        });
        aggregatesService = getAggregatesService_1.getAggregatesService({ repository });
    });
    test('throws an error if the flow name does not exist.', async () => {
        const domainEvent = buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            },
            name: 'executed',
            data: {},
            metadata: { revision: 1 }
        });
        const commandService = getCommandService_1.getCommandService({ domainEvent, issueCommand: issueCommandNoop });
        await assertthat_1.assert.that(async () => {
            await executeFlow_1.executeFlow({
                application,
                flowName: 'nonExistent',
                domainEvent,
                flowProgressStore: consumerProgressStore,
                services: {
                    aggregates: aggregatesService,
                    command: commandService,
                    infrastructure: application.infrastructure,
                    lock: lockService,
                    logger: loggerService,
                    notification: notificationService
                },
                performReplay: performReplayNoop
            });
        }).is.throwingAsync((ex) => ex.code === errors.FlowNotFound.code);
    });
    test('does nothing if the domain event revision is lower than the latest handled revision.', async () => {
        const domainEvent = buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            },
            name: 'executed',
            data: {},
            metadata: { revision: 5 }
        });
        const commandService = getCommandService_1.getCommandService({ domainEvent, issueCommand: issueCommandNoop });
        await consumerProgressStore.setProgress({
            consumerId: 'sampleFlow',
            aggregateIdentifier: domainEvent.aggregateIdentifier,
            revision: 8
        });
        const result = await executeFlow_1.executeFlow({
            application,
            flowName: 'sampleFlow',
            domainEvent,
            flowProgressStore: consumerProgressStore,
            services: {
                aggregates: aggregatesService,
                command: commandService,
                infrastructure: application.infrastructure,
                lock: lockService,
                logger: loggerService,
                notification: notificationService
            },
            performReplay: performReplayNoop
        });
        assertthat_1.assert.that(loggedMessages).is.equalTo([]);
        assertthat_1.assert.that(result).is.equalTo('acknowledge');
    });
    test('does nothing if the domain event revision is equal to the latest handled revision.', async () => {
        const domainEvent = buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            },
            name: 'executed',
            data: {},
            metadata: { revision: 7 }
        });
        const commandService = getCommandService_1.getCommandService({ domainEvent, issueCommand: issueCommandNoop });
        await consumerProgressStore.setProgress({
            consumerId: 'sampleFlow',
            aggregateIdentifier: domainEvent.aggregateIdentifier,
            revision: 7
        });
        const result = await executeFlow_1.executeFlow({
            application,
            flowName: 'sampleFlow',
            domainEvent,
            flowProgressStore: consumerProgressStore,
            services: {
                aggregates: aggregatesService,
                command: commandService,
                infrastructure: application.infrastructure,
                lock: lockService,
                logger: loggerService,
                notification: notificationService
            },
            performReplay: performReplayNoop
        });
        assertthat_1.assert.that(loggedMessages).is.equalTo([]);
        assertthat_1.assert.that(result).is.equalTo('acknowledge');
    });
    test('executes the relevant handlers.', async () => {
        const domainEvent = buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            },
            name: 'executed',
            data: {},
            metadata: { revision: 7 }
        });
        const commandService = getCommandService_1.getCommandService({ domainEvent, issueCommand: issueCommandNoop });
        await consumerProgressStore.setProgress({
            consumerId: 'sampleFlow',
            aggregateIdentifier: domainEvent.aggregateIdentifier,
            revision: 6
        });
        const result = await executeFlow_1.executeFlow({
            application,
            flowName: 'sampleFlow',
            domainEvent,
            flowProgressStore: consumerProgressStore,
            services: {
                aggregates: aggregatesService,
                command: commandService,
                infrastructure: application.infrastructure,
                lock: lockService,
                logger: loggerService,
                notification: notificationService
            },
            performReplay: performReplayNoop
        });
        assertthat_1.assert.that(await consumerProgressStore.getProgress({
            consumerId: 'sampleFlow',
            aggregateIdentifier: domainEvent.aggregateIdentifier
        })).is.equalTo({ revision: 7, isReplaying: false });
        assertthat_1.assert.that(loggedMessages.length).is.equalTo(1);
        assertthat_1.assert.that(loggedMessages[0]).is.equalTo({
            level: 'info',
            message: 'Received domain event.',
            metadata: { domainEvent }
        });
        assertthat_1.assert.that(result).is.equalTo('acknowledge');
    });
    test('handles errors in flow handlers.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withFailingFlow', language: 'javascript' });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        const repository = new Repository_1.Repository({
            application,
            domainEventStore,
            lockStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            publisher,
            pubSubChannelForNotifications
        });
        aggregatesService = getAggregatesService_1.getAggregatesService({ repository });
        const domainEvent = buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            },
            name: 'executed',
            data: {},
            metadata: { revision: 7 }
        });
        const commandService = getCommandService_1.getCommandService({ domainEvent, issueCommand: issueCommandNoop });
        await consumerProgressStore.setProgress({
            consumerId: 'sampleFlow',
            aggregateIdentifier: domainEvent.aggregateIdentifier,
            revision: 6
        });
        await assertthat_1.assert.that(async () => {
            await executeFlow_1.executeFlow({
                application,
                flowName: 'sampleFlow',
                domainEvent,
                flowProgressStore: consumerProgressStore,
                services: {
                    aggregates: aggregatesService,
                    command: commandService,
                    infrastructure: application.infrastructure,
                    lock: lockService,
                    logger: loggerService,
                    notification: notificationService
                },
                performReplay: performReplayNoop
            });
        }).is.throwingAsync((ex) => ex.message === 'An expected error occured.');
        assertthat_1.assert.that(await consumerProgressStore.getProgress({
            consumerId: 'sampleFlow',
            aggregateIdentifier: domainEvent.aggregateIdentifier
        })).is.equalTo({ revision: 6, isReplaying: false });
    });
    test(`on-demand flow returns 'defer', if a missing domain event is detected.`, async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withComplexFlow', language: 'javascript' });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        const repository = new Repository_1.Repository({
            application,
            domainEventStore,
            lockStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            publisher,
            pubSubChannelForNotifications
        });
        aggregatesService = getAggregatesService_1.getAggregatesService({ repository });
        const aggregateId = uuid_1.v4();
        const domainEvents = [
            buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'triggeredFlow',
                data: { flowName: 'onDemandFlow' },
                metadata: { revision: 1 }
            }),
            buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'triggeredFlow',
                data: { flowName: 'onDemandFlow' },
                metadata: { revision: 2 }
            }),
            buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'triggeredFlow',
                data: { flowName: 'onDemandFlow' },
                metadata: { revision: 3 }
            })
        ];
        await domainEventStore.storeDomainEvents({ domainEvents });
        const commandService = getCommandService_1.getCommandService({ domainEvent: domainEvents[2], issueCommand: issueCommandNoop });
        await consumerProgressStore.setProgress({
            consumerId: 'onDemandFlow',
            aggregateIdentifier: domainEvents[2].aggregateIdentifier,
            revision: 1
        });
        let replayRequested = false;
        const result = await executeFlow_1.executeFlow({
            application,
            flowName: 'onDemandFlow',
            domainEvent: domainEvents[2],
            flowProgressStore: consumerProgressStore,
            services: {
                aggregates: aggregatesService,
                command: commandService,
                infrastructure: application.infrastructure,
                lock: lockService,
                logger: loggerService,
                notification: notificationService
            },
            async performReplay() {
                replayRequested = true;
            }
        });
        assertthat_1.assert.that(result).is.equalTo('defer');
        assertthat_1.assert.that(replayRequested).is.false();
    });
    test(`always flow returns 'defer' and requests replay, if a missing domain event is detected.`, async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withComplexFlow', language: 'javascript' });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        const repository = new Repository_1.Repository({
            application,
            domainEventStore,
            lockStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            publisher,
            pubSubChannelForNotifications
        });
        aggregatesService = getAggregatesService_1.getAggregatesService({ repository });
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
        await domainEventStore.storeDomainEvents({ domainEvents });
        const commandService = getCommandService_1.getCommandService({ domainEvent: domainEvents[2], issueCommand: issueCommandNoop });
        await consumerProgressStore.setProgress({
            consumerId: 'alwaysFlow',
            aggregateIdentifier: domainEvents[2].aggregateIdentifier,
            revision: 1
        });
        let replayRequested = false;
        const result = await executeFlow_1.executeFlow({
            application,
            flowName: 'alwaysFlow',
            domainEvent: domainEvents[2],
            flowProgressStore: consumerProgressStore,
            services: {
                aggregates: aggregatesService,
                command: commandService,
                infrastructure: application.infrastructure,
                lock: lockService,
                logger: loggerService,
                notification: notificationService
            },
            async performReplay() {
                replayRequested = true;
            }
        });
        assertthat_1.assert.that(result).is.equalTo('defer');
        assertthat_1.assert.that(replayRequested).is.true();
    });
    test('notifications in flows are published correctly.', async () => {
        const domainEvent = buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            },
            name: 'executed',
            data: {},
            metadata: { revision: 7 }
        });
        const commandService = getCommandService_1.getCommandService({ domainEvent, issueCommand: issueCommandNoop });
        await consumerProgressStore.setProgress({
            consumerId: 'sampleFlow',
            aggregateIdentifier: domainEvent.aggregateIdentifier,
            revision: 6
        });
        await executeFlow_1.executeFlow({
            application,
            flowName: 'sampleFlow',
            domainEvent,
            flowProgressStore: consumerProgressStore,
            services: {
                aggregates: aggregatesService,
                command: commandService,
                infrastructure: application.infrastructure,
                lock: lockService,
                logger: loggerService,
                notification: notificationService
            },
            performReplay: performReplayNoop
        });
        assertthat_1.assert.that(notifications.length).is.equalTo(1);
        assertthat_1.assert.that(notifications[0]).is.equalTo({
            name: 'flowSampleFlowUpdated',
            data: {},
            metadata: undefined
        });
    });
});
//# sourceMappingURL=executeFlowTests.js.map