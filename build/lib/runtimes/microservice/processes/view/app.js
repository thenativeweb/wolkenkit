#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configurationDefinition_1 = require("./configurationDefinition");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../messaging/pubSub/createSubscriber");
const executeNotificationSubscribers_1 = require("../../../../common/domain/executeNotificationSubscribers");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getApi_1 = require("./getApi");
const getIdentityProviders_1 = require("../../../shared/getIdentityProviders");
const getLoggerService_1 = require("../../../../common/services/getLoggerService");
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
        logger.info('Starting view server...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/view'));
        const application = await loadApplication_1.loadApplication({
            applicationDirectory: configuration.applicationDirectory
        });
        const identityProviders = await getIdentityProviders_1.getIdentityProviders({
            identityProvidersEnvironmentVariable: configuration.identityProviders
        });
        const publisher = await createPublisher_1.createPublisher(configuration.pubSubOptions.publisher);
        const subscriber = await createSubscriber_1.createSubscriber(configuration.pubSubOptions.subscriber);
        const { api } = await getApi_1.getApi({
            application,
            configuration,
            identityProviders
        });
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        const server = http_1.default.createServer(api);
        server.listen(configuration.portOrSocket, () => {
            logger.info('Started view server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/view', {
                portOrSocket: configuration.portOrSocket,
                healthPortOrSocket: configuration.healthPortOrSocket
            }));
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
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/view', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map