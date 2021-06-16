"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSandboxForFlow = void 0;
const buildDomainEvent_1 = require("../buildDomainEvent");
const createConsumerProgressStore_1 = require("../../../../stores/consumerProgressStore/createConsumerProgressStore");
const createDomainEventStore_1 = require("../../../../stores/domainEventStore/createDomainEventStore");
const createLockStore_1 = require("../../../../stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const executeFlow_1 = require("../../../domain/executeFlow");
const getAggregateService_1 = require("../../../services/getAggregateService");
const getAggregatesService_1 = require("../../../services/getAggregatesService");
const getClientService_1 = require("../../../services/getClientService");
const getCommandService_1 = require("../../../services/getCommandService");
const getLockService_1 = require("../../../services/getLockService");
const getLoggerService_1 = require("../../../services/getLoggerService");
const getNotificationService_1 = require("../../../services/getNotificationService");
const getSnapshotStrategy_1 = require("../../../domain/getSnapshotStrategy");
const Repository_1 = require("../../../domain/Repository");
const createSandboxForFlow = function (sandboxConfiguration) {
    return {
        when({ aggregateIdentifier, name, data, id, metadata }) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return createSandboxForFlowWithResult({
                ...sandboxConfiguration,
                domainEvents: [
                    ...sandboxConfiguration.domainEvents,
                    buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier,
                        name,
                        data,
                        id,
                        metadata: { ...metadata, revision: metadata.revision }
                    })
                ]
            });
        }
    };
};
exports.createSandboxForFlow = createSandboxForFlow;
const createSandboxForFlowWithResult = function (sandboxConfiguration) {
    return {
        and({ aggregateIdentifier, name, data, id, metadata }) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return createSandboxForFlowWithResult({
                ...sandboxConfiguration,
                domainEvents: [
                    ...sandboxConfiguration.domainEvents,
                    buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier,
                        name,
                        data,
                        id,
                        metadata: { ...metadata, revision: metadata.revision }
                    })
                ]
            });
        },
        async then(callback) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const lockStore = (_a = sandboxConfiguration.lockStore) !== null && _a !== void 0 ? _a : await createLockStore_1.createLockStore({ type: 'InMemory' });
            const domainEventStore = (_b = sandboxConfiguration.domainEventStore) !== null && _b !== void 0 ? _b : await createDomainEventStore_1.createDomainEventStore({ type: 'InMemory' });
            const flowProgressStore = (_c = sandboxConfiguration.flowProgressStore) !== null && _c !== void 0 ? _c : await createConsumerProgressStore_1.createConsumerProgressStore({ type: 'InMemory' });
            const snapshotStrategy = (_d = sandboxConfiguration.snapshotStrategy) !== null && _d !== void 0 ? _d : getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' });
            const publisher = (_e = sandboxConfiguration.publisher) !== null && _e !== void 0 ? _e : await createPublisher_1.createPublisher({ type: 'InMemory' });
            const aggregateServiceFactory = (_f = sandboxConfiguration.aggregateServiceFactory) !== null && _f !== void 0 ? _f : getAggregateService_1.getAggregateService;
            const aggregatesServiceFactory = (_g = sandboxConfiguration.aggregatesServiceFactory) !== null && _g !== void 0 ? _g : getAggregatesService_1.getAggregatesService;
            const clientServiceFactory = (_h = sandboxConfiguration.clientServiceFactory) !== null && _h !== void 0 ? _h : getClientService_1.getClientService;
            const commandServiceFactory = (_j = sandboxConfiguration.commandServiceFactory) !== null && _j !== void 0 ? _j : getCommandService_1.getCommandService;
            const lockServiceFactory = (_k = sandboxConfiguration.lockServiceFactory) !== null && _k !== void 0 ? _k : getLockService_1.getLockService;
            const loggerServiceFactory = (_l = sandboxConfiguration.loggerServiceFactory) !== null && _l !== void 0 ? _l : getLoggerService_1.getLoggerService;
            const notificationServiceFactory = (_m = sandboxConfiguration.notificationServiceFactory) !== null && _m !== void 0 ? _m : getNotificationService_1.getNotificationService;
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
            const issuedCommands = [];
            const issueCommand = async function ({ command }) {
                issuedCommands.push(command);
            };
            for (const domainEvent of sandboxConfiguration.domainEvents) {
                await executeFlow_1.executeFlow({
                    application: sandboxConfiguration.application,
                    domainEvent,
                    flowName: sandboxConfiguration.flowName,
                    flowProgressStore,
                    async performReplay() {
                        // Intentionally left blank.
                    },
                    services: {
                        aggregates: aggregatesServiceFactory({ repository }),
                        command: commandServiceFactory({ domainEvent, issueCommand }),
                        infrastructure: sandboxConfiguration.application.infrastructure,
                        logger: loggerServiceFactory({
                            packageManifest: sandboxConfiguration.application.packageManifest,
                            fileName: `<app>/server/flows/${sandboxConfiguration.flowName}`
                        }),
                        lock: lockServiceFactory({ lockStore }),
                        notification: notificationServiceFactory({
                            application: sandboxConfiguration.application,
                            publisher,
                            channel: 'notifications'
                        })
                    }
                });
            }
            // eslint-disable-next-line callback-return
            await callback({ commands: issuedCommands });
        }
    };
};
//# sourceMappingURL=createSandboxForFlow.js.map