#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configurationDefinition_1 = require("./configurationDefinition");
const createConsumerProgressStore_1 = require("../../../../stores/consumerProgressStore/createConsumerProgressStore");
const createDomainEventStore_1 = require("../../../../stores/domainEventStore/createDomainEventStore");
const createFileStore_1 = require("../../../../stores/fileStore/createFileStore");
const createLockStore_1 = require("../../../../stores/lockStore/createLockStore");
const createPriorityQueueStore_1 = require("../../../../stores/priorityQueueStore/createPriorityQueueStore");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../messaging/pubSub/createSubscriber");
const doesItemIdentifierWithClientMatchCommandWithMetadata_1 = require("../../../../common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata");
const doesItemIdentifierWithClientMatchDomainEvent_1 = require("../../../../common/domain/doesItemIdentifierWithClientMatchDomainEvent");
const executeNotificationSubscribers_1 = require("../../../../common/domain/executeNotificationSubscribers");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getApi_1 = require("./getApi");
const getIdentityProviders_1 = require("../../../shared/getIdentityProviders");
const getLoggerService_1 = require("../../../../common/services/getLoggerService");
const getSnapshotStrategy_1 = require("../../../../common/domain/getSnapshotStrategy");
const http_1 = __importDefault(require("http"));
const loadApplication_1 = require("../../../../common/application/loadApplication");
const p_forever_1 = __importDefault(require("p-forever"));
const processCommand_1 = require("./domain/processCommand");
const processDomainEvent_1 = require("./flow/processDomainEvent");
const registerExceptionHandler_1 = require("../../../../common/utils/process/registerExceptionHandler");
const Repository_1 = require("../../../../common/domain/Repository");
const runHealthServer_1 = require("../../../shared/runHealthServer");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async () => {
    const logger = flaschenpost_1.flaschenpost.getLogger();
    try {
        registerExceptionHandler_1.registerExceptionHandler();
        const configuration = await fromEnvironmentVariables_1.fromEnvironmentVariables({ configurationDefinition: configurationDefinition_1.configurationDefinition });
        logger.info('Starting single process runtime server...', withLogMetadata_1.withLogMetadata('runtime', 'singleProcess/main'));
        const identityProviders = await getIdentityProviders_1.getIdentityProviders({
            identityProvidersEnvironmentVariable: configuration.identityProviders
        });
        const application = await loadApplication_1.loadApplication({
            applicationDirectory: configuration.applicationDirectory
        });
        const domainEventStore = await createDomainEventStore_1.createDomainEventStore(configuration.domainEventStoreOptions);
        const lockStore = await createLockStore_1.createLockStore(configuration.lockStoreOptions);
        const publisher = await createPublisher_1.createPublisher(configuration.pubSubOptions.publisher);
        const subscriber = await createSubscriber_1.createSubscriber(configuration.pubSubOptions.subscriber);
        const repository = new Repository_1.Repository({
            application,
            lockStore,
            domainEventStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy(configuration.snapshotStrategy),
            publisher,
            pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotifications
        });
        const consumerProgressStore = await createConsumerProgressStore_1.createConsumerProgressStore(configuration.consumerProgressStoreOptions);
        const priorityQueueStoreForCommands = await createPriorityQueueStore_1.createPriorityQueueStore({
            ...configuration.priorityQueueStoreForCommandsOptions,
            doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata_1.doesItemIdentifierWithClientMatchCommandWithMetadata
        });
        const priorityQueueStoreForDomainEvents = await createPriorityQueueStore_1.createPriorityQueueStore({
            ...configuration.priorityQueueStoreForDomainEventsOptions,
            doesIdentifierMatchItem: doesItemIdentifierWithClientMatchDomainEvent_1.doesItemIdentifierWithClientMatchDomainEvent
        });
        const onReceiveCommand = async function ({ command }) {
            await priorityQueueStoreForCommands.enqueue({
                item: command,
                discriminator: command.aggregateIdentifier.aggregate.id,
                priority: command.metadata.timestamp
            });
        };
        const onCancelCommand = async function ({ commandIdentifierWithClient }) {
            await priorityQueueStoreForCommands.remove({
                discriminator: commandIdentifierWithClient.aggregateIdentifier.aggregate.id,
                itemIdentifier: commandIdentifierWithClient
            });
        };
        const issueCommand = async function ({ command }) {
            await priorityQueueStoreForCommands.enqueue({
                item: command,
                discriminator: command.aggregateIdentifier.aggregate.id,
                priority: command.metadata.timestamp
            });
        };
        const performReplay = async function ({ flowNames, aggregates }) {
            for (const flowName of flowNames) {
                for (const aggregate of aggregates) {
                    const domainEventStream = await domainEventStore.getReplayForAggregate({
                        aggregateId: aggregate.aggregateIdentifier.aggregate.id,
                        fromRevision: aggregate.from,
                        toRevision: aggregate.to
                    });
                    for await (const domainEvent of domainEventStream) {
                        await priorityQueueStoreForDomainEvents.enqueue({
                            item: domainEvent,
                            discriminator: flowName,
                            priority: domainEvent.metadata.timestamp
                        });
                    }
                }
            }
        };
        const fileStore = await createFileStore_1.createFileStore(configuration.fileStoreOptions);
        const { api, publishDomainEvent, initializeGraphQlOnServer } = await getApi_1.getApi({
            configuration,
            application,
            identityProviders,
            onReceiveCommand,
            onCancelCommand,
            repository,
            fileStore,
            subscriber,
            channelForNotifications: configuration.pubSubOptions.channelForNotifications,
            performReplay
        });
        const server = http_1.default.createServer(api);
        await (initializeGraphQlOnServer === null || initializeGraphQlOnServer === void 0 ? void 0 : initializeGraphQlOnServer({ server }));
        await runHealthServer_1.runHealthServer({ corsOrigin: configuration.corsOrigin, portOrSocket: configuration.healthPortOrSocket });
        server.listen(configuration.portOrSocket, () => {
            logger.info('Started single process runtime server.', withLogMetadata_1.withLogMetadata('runtime', 'singleProcess/main', { portOrSocket: configuration.portOrSocket }));
        });
        await subscriber.subscribe({
            channel: configuration.pubSubOptions.channelForNotifications,
            async callback(notification) {
                const notifications = [];
                for (const viewName of Object.keys(application.views)) {
                    await executeNotificationSubscribers_1.executeNotificationSubscribers({
                        application,
                        viewName,
                        notification,
                        services: {
                            logger: getLoggerService_1.getLoggerService({
                                packageManifest: application.packageManifest,
                                fileName: `<app>/server/views/${viewName}`
                            }),
                            notification: {
                                publish(name, data, metadata) {
                                    notifications.push({ name, data, metadata });
                                }
                            }
                        }
                    });
                }
                for (const newNotification of notifications) {
                    await publisher.publish({
                        channel: configuration.pubSubOptions.channelForNotifications,
                        message: newNotification
                    });
                }
            }
        });
        const publishDomainEvents = async function ({ domainEvents }) {
            for (const domainEvent of domainEvents) {
                publishDomainEvent({ domainEvent });
                for (const flowName of Object.keys(application.flows)) {
                    await priorityQueueStoreForDomainEvents.enqueue({
                        item: domainEvent.withoutState(),
                        discriminator: flowName,
                        priority: domainEvent.metadata.timestamp
                    });
                }
            }
        };
        for (let i = 0; i < configuration.concurrentCommands; i++) {
            p_forever_1.default(async () => {
                await processCommand_1.processCommand({
                    application,
                    repository,
                    lockStore,
                    priorityQueue: {
                        store: priorityQueueStoreForCommands,
                        renewalInterval: configuration.commandQueueRenewInterval
                    },
                    publishDomainEvents
                });
            });
        }
        for (let i = 0; i < configuration.concurrentFlows; i++) {
            p_forever_1.default(async () => {
                await processDomainEvent_1.processDomainEvent({
                    application,
                    repository,
                    lockStore,
                    priorityQueue: {
                        store: priorityQueueStoreForDomainEvents,
                        renewalInterval: configuration.commandQueueRenewInterval
                    },
                    consumerProgressStore,
                    issueCommand,
                    performReplay
                });
            });
        }
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'singleProcess/main', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map