#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Aeonstore_1 = require("../../../../stores/domainEventStore/Aeonstore");
const configurationDefinition_1 = require("./configurationDefinition");
const Client_1 = require("../../../../apis/handleDomainEvent/http/v2/Client");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getApi_1 = require("./getApi");
const getPerformReplay_1 = require("./getPerformReplay");
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
        logger.info('Starting replay server...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/replay'));
        const application = await loadApplication_1.loadApplication({
            applicationDirectory: configuration.applicationDirectory
        });
        const domainEventStore = await Aeonstore_1.AeonstoreDomainEventStore.create({
            protocol: configuration.aeonstoreProtocol,
            hostName: configuration.aeonstoreHostName,
            portOrSocket: configuration.aeonstorePortOrSocket
        });
        const domainEventDispatcherClient = new Client_1.Client({
            protocol: configuration.domainEventDispatcherProtocol,
            hostName: configuration.domainEventDispatcherHostName,
            portOrSocket: configuration.domainEventDispatcherPortOrSocket,
            path: '/handle-domain-event/v2'
        });
        const performReplay = getPerformReplay_1.getPerformReplay({
            domainEventStore,
            domainEventDispatcherClient
        });
        const { api } = await getApi_1.getApi({
            configuration,
            application,
            performReplay
        });
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        const server = http_1.default.createServer(api);
        server.listen(configuration.portOrSocket, () => {
            logger.info('Started replay server.', withLogMetadata_1.withLogMetadata('runtime', 'replay', {
                portOrSocket: configuration.portOrSocket,
                healthPortOrSocket: configuration.healthPortOrSocket
            }));
        });
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/replay', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map