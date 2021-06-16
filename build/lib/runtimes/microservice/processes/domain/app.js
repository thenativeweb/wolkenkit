#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Aeonstore_1 = require("../../../../stores/domainEventStore/Aeonstore");
const Client_1 = require("../../../../apis/awaitItem/http/v2/Client");
const CommandWithMetadata_1 = require("../../../../common/elements/CommandWithMetadata");
const configurationDefinition_1 = require("./configurationDefinition");
const createLockStore_1 = require("../../../../stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const Client_2 = require("../../../../apis/handleDomainEvent/http/v2/Client");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getSnapshotStrategy_1 = require("../../../../common/domain/getSnapshotStrategy");
const loadApplication_1 = require("../../../../common/application/loadApplication");
const p_forever_1 = __importDefault(require("p-forever"));
const processCommand_1 = require("./processCommand");
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
        logger.info('Starting domain server...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain'));
        const application = await loadApplication_1.loadApplication({
            applicationDirectory: configuration.applicationDirectory
        });
        const domainEventStore = await Aeonstore_1.AeonstoreDomainEventStore.create({
            protocol: configuration.aeonstoreProtocol,
            hostName: configuration.aeonstoreHostName,
            portOrSocket: configuration.aeonstorePortOrSocket
        });
        const lockStore = await createLockStore_1.createLockStore(configuration.lockStoreOptions);
        const publisher = await createPublisher_1.createPublisher(configuration.pubSubOptions.publisher);
        const repository = new Repository_1.Repository({
            application,
            lockStore,
            domainEventStore,
            publisher,
            pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotifications,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy(configuration.snapshotStrategy)
        });
        const commandDispatcherClient = new Client_1.Client({
            protocol: configuration.commandDispatcherProtocol,
            hostName: configuration.commandDispatcherHostName,
            portOrSocket: configuration.commandDispatcherPortOrSocket,
            path: '/await-command/v2',
            createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
        });
        const domainEventDispatcherClient = new Client_2.Client({
            protocol: configuration.domainEventDispatcherProtocol,
            hostName: configuration.domainEventDispatcherHostName,
            portOrSocket: configuration.domainEventDispatcherPortOrSocket,
            path: '/handle-domain-event/v2'
        });
        const publishDomainEvents = async ({ domainEvents }) => {
            logger.debug('Publishing domain events...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { domainEvents }));
            for (const domainEvent of domainEvents) {
                await publisher.publish({
                    channel: configuration.pubSubOptions.channelForNewDomainEvents,
                    message: domainEvent
                });
                await domainEventDispatcherClient.postDomainEvent({
                    domainEvent: domainEvent.withoutState()
                });
            }
            logger.debug('Published domain events.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { domainEvents }));
        };
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        logger.info('Started domain server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { healthPortOrSocket: configuration.healthPortOrSocket }));
        for (let i = 0; i < configuration.concurrentCommands; i++) {
            p_forever_1.default(async () => {
                await processCommand_1.processCommand({
                    commandDispatcher: {
                        client: commandDispatcherClient,
                        renewalInterval: configuration.commandDispatcherRenewInterval,
                        acknowledgeRetries: configuration.commandDispatcherAcknowledgeRetries
                    },
                    repository,
                    publishDomainEvents
                });
            });
            logger.debug('Started command process loop.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { loopIndex: i }));
        }
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map