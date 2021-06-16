#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configurationDefinition_1 = require("./configurationDefinition");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../messaging/pubSub/createSubscriber");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getApi_1 = require("./getApi");
const getOnReceiveMessage_1 = require("./getOnReceiveMessage");
const http_1 = __importDefault(require("http"));
const registerExceptionHandler_1 = require("../../../../common/utils/process/registerExceptionHandler");
const runHealthServer_1 = require("../../../shared/runHealthServer");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async () => {
    const logger = flaschenpost_1.flaschenpost.getLogger();
    try {
        registerExceptionHandler_1.registerExceptionHandler();
        const configuration = await fromEnvironmentVariables_1.fromEnvironmentVariables({ configurationDefinition: configurationDefinition_1.configurationDefinition });
        logger.info('Starting publisher server...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/publisher'));
        const subscriber = await createSubscriber_1.createSubscriber(configuration.pubSubOptions.subscriber);
        const publisher = await createPublisher_1.createPublisher(configuration.pubSubOptions.publisher);
        const onReceiveMessage = getOnReceiveMessage_1.getOnReceiveMessage({
            publisher
        });
        const { api, publishMessage } = await getApi_1.getApi({
            configuration,
            onReceiveMessage
        });
        subscriber.subscribe({
            channel: '*',
            callback(message) {
                // This callback has its scope set by the subscriber. To make
                // TypeScript understand this, we have to forcibly convert the type.
                publishMessage({ channel: this.event, message });
            }
        });
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        const server = http_1.default.createServer(api);
        server.listen(configuration.portOrSocket, () => {
            logger.info('Started publisher server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/publisher', {
                portOrSocket: configuration.portOrSocket,
                healthPortOrSocket: configuration.healthPortOrSocket
            }));
        });
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/publisher', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map