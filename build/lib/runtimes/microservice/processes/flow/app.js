#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Aeonstore_1 = require("../../../../stores/domainEventStore/Aeonstore");
const Client_1 = require("../../../../apis/handleCommandWithMetadata/http/v2/Client");
const configurationDefinition_1 = require("./configurationDefinition");
const createConsumerProgressStore_1 = require("../../../../stores/consumerProgressStore/createConsumerProgressStore");
const createLockStore_1 = require("../../../../stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const DomainEvent_1 = require("../../../../common/elements/DomainEvent");
const Client_2 = require("../../../../apis/awaitItem/http/v2/Client");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getSnapshotStrategy_1 = require("../../../../common/domain/getSnapshotStrategy");
const loadApplication_1 = require("../../../../common/application/loadApplication");
const p_forever_1 = __importDefault(require("p-forever"));
const processDomainEvent_1 = require("./processDomainEvent");
const registerExceptionHandler_1 = require("../../../../common/utils/process/registerExceptionHandler");
const Client_3 = require("../../../../apis/performReplay/http/v2/Client");
const Repository_1 = require("../../../../common/domain/Repository");
const runHealthServer_1 = require("../../../shared/runHealthServer");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async () => {
    const logger = flaschenpost_1.flaschenpost.getLogger();
    try {
        registerExceptionHandler_1.registerExceptionHandler();
        const configuration = await fromEnvironmentVariables_1.fromEnvironmentVariables({ configurationDefinition: configurationDefinition_1.configurationDefinition });
        logger.info('Starting flow server...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/flow'));
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
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy(configuration.snapshotStrategy),
            publisher,
            pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotifications
        });
        const consumerProgressStore = await createConsumerProgressStore_1.createConsumerProgressStore(configuration.consumerProgressStoreOptions);
        const domainEventDispatcherClient = new Client_2.Client({
            protocol: configuration.domainEventDispatcherProtocol,
            hostName: configuration.domainEventDispatcherHostName,
            portOrSocket: configuration.domainEventDispatcherPortOrSocket,
            path: '/await-domain-event/v2',
            createItemInstance: ({ item }) => new DomainEvent_1.DomainEvent(item)
        });
        const commandDispatcherClient = new Client_1.Client({
            protocol: configuration.commandDispatcherProtocol,
            hostName: configuration.commandDispatcherHostName,
            portOrSocket: configuration.commandDispatcherPortOrSocket,
            path: '/handle-command/v2'
        });
        const replayClient = new Client_3.Client({
            protocol: configuration.replayServerProtocol,
            hostName: configuration.replayServerHostName,
            portOrSocket: configuration.replayServerPortOrSocket,
            path: '/perform-replay/v2'
        });
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        logger.info('Started flow server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/flow', {
            healthPortOrSocket: configuration.healthPortOrSocket
        }));
        const issueCommand = async function ({ command }) {
            await commandDispatcherClient.postCommand({ command });
        };
        const performReplay = async function ({ flowNames, aggregates }) {
            await replayClient.performReplay({
                flowNames,
                aggregates
            });
        };
        for (let i = 0; i < configuration.concurrentFlows; i++) {
            p_forever_1.default(async () => {
                await processDomainEvent_1.processDomainEvent({
                    application,
                    domainEventDispatcher: {
                        client: domainEventDispatcherClient,
                        renewalInterval: configuration.domainEventDispatcherRenewInterval,
                        acknowledgeRetries: configuration.domainEventDispatcherAcknowledgeRetries
                    },
                    consumerProgressStore,
                    lockStore,
                    repository,
                    issueCommand,
                    performReplay
                });
            });
        }
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/flow', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map