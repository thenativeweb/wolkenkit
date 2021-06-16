"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSandboxForAggregate = void 0;
const buildCommandWithMetadata_1 = require("../buildCommandWithMetadata");
const buildDomainEvent_1 = require("../buildDomainEvent");
const createDomainEventStore_1 = require("../../../../stores/domainEventStore/createDomainEventStore");
const createLockStore_1 = require("../../../../stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const getAggregateService_1 = require("../../../services/getAggregateService");
const getAggregatesService_1 = require("../../../services/getAggregatesService");
const getClientService_1 = require("../../../services/getClientService");
const getLockService_1 = require("../../../services/getLockService");
const getLoggerService_1 = require("../../../services/getLoggerService");
const getNotificationService_1 = require("../../../services/getNotificationService");
const getSnapshotStrategy_1 = require("../../../domain/getSnapshotStrategy");
const Repository_1 = require("../../../domain/Repository");
const createSandboxForAggregate = function (sandboxConfiguration) {
    return {
        given({ name, data, id, metadata }) {
            return createSandboxForAggregate({
                ...sandboxConfiguration,
                domainEvents: [
                    ...sandboxConfiguration.domainEvents,
                    buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: sandboxConfiguration.aggregateIdentifier,
                        name,
                        data,
                        id,
                        metadata: { ...metadata, revision: 0 }
                    })
                ]
            });
        },
        and({ name, data, id, metadata }) {
            return createSandboxForAggregate({
                ...sandboxConfiguration,
                domainEvents: [
                    ...sandboxConfiguration.domainEvents,
                    buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: sandboxConfiguration.aggregateIdentifier,
                        name,
                        data,
                        id,
                        metadata: { ...metadata, revision: 0 }
                    })
                ]
            });
        },
        when({ name, data, id, metadata }) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return createSandboxForAggregateWithResult({
                ...sandboxConfiguration,
                commands: [
                    ...sandboxConfiguration.commands,
                    buildCommandWithMetadata_1.buildCommandWithMetadata({
                        aggregateIdentifier: sandboxConfiguration.aggregateIdentifier,
                        name,
                        data,
                        id,
                        metadata
                    })
                ]
            });
        }
    };
};
exports.createSandboxForAggregate = createSandboxForAggregate;
const createSandboxForAggregateWithResult = function (sandboxConfiguration) {
    return {
        and({ name, data, id, metadata }) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return createSandboxForAggregateWithResult({
                ...sandboxConfiguration,
                commands: [
                    ...sandboxConfiguration.commands,
                    buildCommandWithMetadata_1.buildCommandWithMetadata({
                        aggregateIdentifier: sandboxConfiguration.aggregateIdentifier,
                        name,
                        data,
                        id,
                        metadata
                    })
                ]
            });
        },
        async then(callback) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const lockStore = (_a = sandboxConfiguration.lockStore) !== null && _a !== void 0 ? _a : await createLockStore_1.createLockStore({ type: 'InMemory' });
            const domainEventStore = (_b = sandboxConfiguration.domainEventStore) !== null && _b !== void 0 ? _b : await createDomainEventStore_1.createDomainEventStore({ type: 'InMemory' });
            const snapshotStrategy = (_c = sandboxConfiguration.snapshotStrategy) !== null && _c !== void 0 ? _c : getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' });
            const publisher = (_d = sandboxConfiguration.publisher) !== null && _d !== void 0 ? _d : await createPublisher_1.createPublisher({ type: 'InMemory' });
            const aggregateServiceFactory = (_e = sandboxConfiguration.aggregateServiceFactory) !== null && _e !== void 0 ? _e : getAggregateService_1.getAggregateService;
            const aggregatesServiceFactory = (_f = sandboxConfiguration.aggregatesServiceFactory) !== null && _f !== void 0 ? _f : getAggregatesService_1.getAggregatesService;
            const clientServiceFactory = (_g = sandboxConfiguration.clientServiceFactory) !== null && _g !== void 0 ? _g : getClientService_1.getClientService;
            const lockServiceFactory = (_h = sandboxConfiguration.lockServiceFactory) !== null && _h !== void 0 ? _h : getLockService_1.getLockService;
            const loggerServiceFactory = (_j = sandboxConfiguration.loggerServiceFactory) !== null && _j !== void 0 ? _j : getLoggerService_1.getLoggerService;
            const notificationServiceFactory = (_k = sandboxConfiguration.notificationServiceFactory) !== null && _k !== void 0 ? _k : getNotificationService_1.getNotificationService;
            const lastDomainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier: sandboxConfiguration.aggregateIdentifier });
            const nextRevision = ((_l = lastDomainEvent === null || lastDomainEvent === void 0 ? void 0 : lastDomainEvent.metadata.revision) !== null && _l !== void 0 ? _l : 0) + 1;
            for (const [index, domainEvent] of sandboxConfiguration.domainEvents.entries()) {
                domainEvent.metadata.revision = nextRevision + index;
            }
            if (sandboxConfiguration.domainEvents.length > 0) {
                await domainEventStore.storeDomainEvents({ domainEvents: sandboxConfiguration.domainEvents });
            }
            const repository = new Repository_1.Repository({
                application: sandboxConfiguration.application,
                lockStore,
                domainEventStore,
                snapshotStrategy,
                publisher,
                pubSubChannelForNotifications: 'notifications',
                serviceFactories: {
                    getAggregateService: aggregateServiceFactory,
                    getAggregatesService: aggregatesServiceFactory,
                    getClientService: clientServiceFactory,
                    getLockService: lockServiceFactory,
                    getLoggerService: loggerServiceFactory,
                    getNotificationService: notificationServiceFactory
                }
            });
            const aggregateInstance = await repository.getAggregateInstance({
                aggregateIdentifier: sandboxConfiguration.aggregateIdentifier
            });
            let domainEventsWithState = [];
            for (const command of sandboxConfiguration.commands) {
                domainEventsWithState = await aggregateInstance.handleCommand({ command });
            }
            const domainEvents = domainEventsWithState.map((domainEventWithState) => domainEventWithState.withoutState());
            // eslint-disable-next-line callback-return
            await callback({ domainEvents, state: aggregateInstance.state });
        }
    };
};
//# sourceMappingURL=createSandboxForAggregate.js.map