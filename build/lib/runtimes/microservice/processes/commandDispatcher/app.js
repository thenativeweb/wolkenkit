#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configurationDefinition_1 = require("./configurationDefinition");
const createPriorityQueueStore_1 = require("../../../../stores/priorityQueueStore/createPriorityQueueStore");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../messaging/pubSub/createSubscriber");
const doesItemIdentifierWithClientMatchCommandWithMetadata_1 = require("../../../../common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getApi_1 = require("./getApi");
const getOnCancelCommand_1 = require("./getOnCancelCommand");
const getOnReceiveCommand_1 = require("./getOnReceiveCommand");
const http_1 = __importDefault(require("http"));
const loadApplication_1 = require("../../../../common/application/loadApplication");
const registerExceptionHandler_1 = require("../../../../common/utils/process/registerExceptionHandler");
const runHealthServer_1 = require("../../../shared/runHealthServer");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async () => {
    const logger = flaschenpost_1.flaschenpost.getLogger();
    try {
        registerExceptionHandler_1.registerExceptionHandler();
        const configuration = await fromEnvironmentVariables_1.fromEnvironmentVariables({ configurationDefinition: configurationDefinition_1.configurationDefinition });
        logger.info('Starting command dispatcher server...', withLogMetadata_1.withLogMetadata('runtime', 'microprocess/command'));
        const application = await loadApplication_1.loadApplication({
            applicationDirectory: configuration.applicationDirectory
        });
        const priorityQueueStore = await createPriorityQueueStore_1.createPriorityQueueStore({
            ...configuration.priorityQueueStoreOptions,
            doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata_1.doesItemIdentifierWithClientMatchCommandWithMetadata
        });
        const newCommandSubscriber = await createSubscriber_1.createSubscriber(configuration.pubSubOptions.subscriber);
        const newCommandPublisher = await createPublisher_1.createPublisher(configuration.pubSubOptions.publisher);
        const onReceiveCommand = getOnReceiveCommand_1.getOnReceiveCommand({
            priorityQueueStore,
            newCommandPublisher,
            newCommandPubSubChannel: configuration.pubSubOptions.channelForNewCommands
        });
        const onCancelCommand = getOnCancelCommand_1.getOnCancelCommand({ priorityQueueStore });
        // Publish "new command" events on an interval even if there are no new
        // commands so that missed events or crashing workers will not lead to
        // unprocessed commands.
        setInterval(async () => {
            await newCommandPublisher.publish({
                channel: configuration.pubSubOptions.channelForNewCommands,
                message: {}
            });
            logger.debug('Sent "new command" event on interval.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher'));
        }, configuration.missedCommandRecoveryInterval);
        const { api } = await getApi_1.getApi({
            configuration,
            application,
            priorityQueueStore: priorityQueueStore,
            newCommandSubscriber,
            newCommandPubSubChannel: configuration.pubSubOptions.channelForNewCommands,
            onReceiveCommand,
            onCancelCommand
        });
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        const server = http_1.default.createServer(api);
        server.listen(configuration.portOrSocket, () => {
            logger.info('Started command dispatcher server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher', { portOrSocket: configuration.portOrSocket, healthPortOrSocket: configuration.healthPortOrSocket }));
        });
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map