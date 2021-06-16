#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("../../../../apis/handleCommandWithMetadata/http/v2/Client");
const configurationDefinition_1 = require("./configurationDefinition");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getApi_1 = require("./getApi");
const getIdentityProviders_1 = require("../../../shared/getIdentityProviders");
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
        logger.info('Starting command server...', withLogMetadata_1.withLogMetadata('runtime', 'microprocess/command'));
        const identityProviders = await getIdentityProviders_1.getIdentityProviders({
            identityProvidersEnvironmentVariable: configuration.identityProviders
        });
        const application = await loadApplication_1.loadApplication({
            applicationDirectory: configuration.applicationDirectory
        });
        const commandDispatcherClient = new Client_1.Client({
            protocol: configuration.commandDispatcherProtocol,
            hostName: configuration.commandDispatcherHostName,
            portOrSocket: configuration.commandDispatcherPortOrSocket,
            path: '/handle-command/v2'
        });
        const commandDispatcher = {
            client: commandDispatcherClient,
            retries: configuration.commandDispatcherRetries
        };
        const onReceiveCommand = getOnReceiveCommand_1.getOnReceiveCommand({ commandDispatcher });
        const onCancelCommand = getOnCancelCommand_1.getOnCancelCommand({ commandDispatcher });
        const { api } = await getApi_1.getApi({
            configuration,
            application,
            identityProviders,
            onReceiveCommand,
            onCancelCommand
        });
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        const server = http_1.default.createServer(api);
        server.listen(configuration.portOrSocket, () => {
            logger.info('Started command server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/command', { portOrSocket: configuration.portOrSocket, healthPortOrSocket: configuration.healthPortOrSocket }));
        });
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/command', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map