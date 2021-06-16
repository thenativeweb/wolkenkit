"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.devCommand = void 0;
const buildApplication_1 = require("../../../common/application/buildApplication");
const buntstift_1 = require("buntstift");
const configurationDefinition_1 = require("../../../runtimes/singleProcess/processes/main/configurationDefinition");
const getAbsolutePath_1 = require("../../../common/utils/path/getAbsolutePath");
const getApplicationPackageJson_1 = require("../../../common/application/getApplicationPackageJson");
const getApplicationRoot_1 = require("../../../common/application/getApplicationRoot");
const startProcess_1 = require("../../../runtimes/shared/startProcess");
const toEnvironmentVariables_1 = require("../../../runtimes/shared/toEnvironmentVariables");
const validatePort_1 = require("./validatePort");
const validateSocket_1 = require("./validateSocket");
const errors = __importStar(require("../../../common/errors"));
const devCommand = function () {
    return {
        name: 'dev',
        description: 'Run an application in development mode.',
        optionDefinitions: [
            {
                name: 'port',
                alias: 'p',
                description: 'set a port',
                parameterName: 'port',
                type: 'number',
                isRequired: false,
                validate: validatePort_1.validatePort
            },
            {
                name: 'socket',
                alias: 's',
                description: 'set a socket',
                parameterName: 'path',
                type: 'string',
                isRequired: false,
                validate: validateSocket_1.validateSocket
            },
            {
                name: 'health-port',
                description: 'set a port for the health endpoint',
                parameterName: 'port',
                type: 'number',
                isRequired: false,
                validate: validatePort_1.validatePort
            },
            {
                name: 'health-socket',
                description: 'set a socket for the health endpoint',
                parameterName: 'path',
                type: 'string',
                isRequired: false,
                validate: validateSocket_1.validateSocket
            },
            {
                name: 'identity-provider-issuer',
                alias: 'i',
                description: 'set an identity provider issuer url',
                parameterName: 'url',
                type: 'string',
                isRequired: false
            },
            {
                name: 'identity-provider-certificate',
                alias: 'c',
                description: 'set an identity provider certificate directory',
                parameterName: 'directory',
                type: 'string',
                isRequired: false
            },
            {
                name: 'debug',
                alias: 'd',
                description: 'enable debug mode',
                type: 'boolean',
                defaultValue: false,
                isRequired: false
            }
        ],
        async handle({ options: { verbose, port, socket, 'health-port': healthPort, 'health-socket': healthSocket, 'identity-provider-issuer': identityProviderIssuer, 'identity-provider-certificate': identityProviderCertificate, debug } }) {
            var _a, _b;
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            if (port && socket) {
                buntstift_1.buntstift.info('Port and socket must not be set at the same time.');
                throw new errors.ParameterInvalid();
            }
            if (healthPort && healthSocket) {
                buntstift_1.buntstift.info('Health port and health socket must not be set at the same time.');
                throw new errors.ParameterInvalid();
            }
            const portOrSocket = (_a = port !== null && port !== void 0 ? port : socket) !== null && _a !== void 0 ? _a : 3000;
            const healthPortOrSocket = (_b = healthPort !== null && healthPort !== void 0 ? healthPort : healthSocket) !== null && _b !== void 0 ? _b : 3001;
            try {
                const applicationDirectory = await getApplicationRoot_1.getApplicationRoot({ directory: process.cwd() });
                const { name, dependencies, devDependencies } = await getApplicationPackageJson_1.getApplicationPackageJson({ directory: process.cwd() });
                if (!(dependencies === null || dependencies === void 0 ? void 0 : dependencies.wolkenkit) && !(devDependencies === null || devDependencies === void 0 ? void 0 : devDependencies.wolkenkit)) {
                    buntstift_1.buntstift.info('Application not found.');
                    throw new errors.ApplicationNotFound();
                }
                const identityProviders = [];
                if (identityProviderIssuer && identityProviderCertificate) {
                    identityProviders.push({
                        issuer: identityProviderIssuer,
                        certificate: getAbsolutePath_1.getAbsolutePath({ path: identityProviderCertificate, cwd: process.cwd() })
                    });
                }
                const env = {
                    ...toEnvironmentVariables_1.toEnvironmentVariables({
                        configuration: {
                            applicationDirectory,
                            commandQueueRenewInterval: 5000,
                            concurrentCommands: 100,
                            concurrentFlows: configurationDefinition_1.configurationDefinition.concurrentFlows.defaultValue,
                            consumerProgressStoreOptions: configurationDefinition_1.configurationDefinition.consumerProgressStoreOptions.defaultValue,
                            corsOrigin: '*',
                            domainEventStoreOptions: { type: 'InMemory' },
                            enableOpenApiDocumentation: true,
                            fileStoreOptions: { type: 'InMemory' },
                            graphqlApi: { enableIntegratedClient: true },
                            healthPortOrSocket,
                            heartbeatInterval: 90000,
                            httpApi: true,
                            identityProviders,
                            lockStoreOptions: { type: 'InMemory' },
                            portOrSocket,
                            priorityQueueStoreForCommandsOptions: configurationDefinition_1.configurationDefinition.priorityQueueStoreForCommandsOptions.defaultValue,
                            priorityQueueStoreForDomainEventsOptions: configurationDefinition_1.configurationDefinition.priorityQueueStoreForDomainEventsOptions.defaultValue,
                            pubSubOptions: {
                                channelForNotifications: 'notification',
                                publisher: { type: 'InMemory' },
                                subscriber: { type: 'InMemory' }
                            },
                            snapshotStrategy: {
                                name: 'revision',
                                configuration: { revisionLimit: 100 }
                            }
                        },
                        configurationDefinition: configurationDefinition_1.configurationDefinition
                    }),
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    LOG_LEVEL: 'debug',
                    // Here, we don't want the environment variables to be parsed, but
                    // instead we need their raw values. This is why we do not use the
                    // processenv module here, but rely on process.env directly.
                    // eslint-disable-next-line no-process-env
                    ...process.env
                };
                buntstift_1.buntstift.verbose(`Compiling the '${name}' application...`);
                await buildApplication_1.buildApplication({ applicationDirectory });
                buntstift_1.buntstift.verbose(`Compiled the '${name}' application.`);
                if (verbose) {
                    buntstift_1.buntstift.newLine();
                }
                buntstift_1.buntstift.info(`Starting the '${name}' application...`);
                buntstift_1.buntstift.newLine();
                buntstift_1.buntstift.info(`  API port or socket     ${env.PORT_OR_SOCKET}`);
                buntstift_1.buntstift.info(`  Health port or socket  ${env.HEALTH_PORT_OR_SOCKET}`);
                buntstift_1.buntstift.newLine();
                buntstift_1.buntstift.info(`To stop the '${name}' application, press <Ctrl>+<C>.`);
                buntstift_1.buntstift.line();
                stopWaiting();
                await startProcess_1.startProcess({
                    runtime: 'singleProcess',
                    name: 'main',
                    enableDebugMode: debug,
                    portOrSocket: Number(env.HEALTH_PORT_OR_SOCKET),
                    env,
                    onExit(exitCode) {
                        // eslint-disable-next-line unicorn/no-process-exit
                        process.exit(exitCode);
                    }
                });
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to run the application.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.devCommand = devCommand;
//# sourceMappingURL=devCommand.js.map