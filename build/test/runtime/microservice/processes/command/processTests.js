"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const Client_1 = require("../../../../../lib/apis/awaitItem/http/v2/Client");
const Command_1 = require("../../../../../lib/common/elements/Command");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition");
const CommandWithMetadata_1 = require("../../../../../lib/common/elements/CommandWithMetadata");
const configurationDefinition_2 = require("../../../../../lib/runtimes/microservice/processes/command/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const Client_2 = require("../../../../../lib/apis/handleCommand/http/v2/Client");
const Client_3 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const path_1 = __importDefault(require("path"));
const sleep_1 = require("../../../../../lib/common/utils/sleep");
const startCatchAllServer_1 = require("../../../../shared/runtime/startCatchAllServer");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
const certificateDirectory = path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');
suite('command process', () => {
    suite('without retries', function () {
        this.timeout(60000);
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' }), identityProviders = [{ issuer: 'https://token.invalid', certificate: certificateDirectory }];
        let awaitCommandClient, commandConfiguration, commandDispatcherHealthSocket, commandDispatcherSocket, handleCommandClient, healthSocket, socket, stopCommandDispatcherProcess, stopProcess;
        setup(async () => {
            [socket, healthSocket, commandDispatcherSocket, commandDispatcherHealthSocket] = await getSocketPaths_1.getSocketPaths({ count: 4 });
            const commandDispatcherConfiguration = {
                ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
                applicationDirectory,
                priorityQueueStoreOptions: { type: 'InMemory', expirationTime: 600 },
                portOrSocket: commandDispatcherSocket,
                healthPortOrSocket: commandDispatcherHealthSocket,
                missedCommandRecoveryInterval: 600
            };
            stopCommandDispatcherProcess = await startProcess_1.startProcess({
                runtime: 'microservice',
                name: 'commandDispatcher',
                enableDebugMode: false,
                portOrSocket: commandDispatcherHealthSocket,
                env: toEnvironmentVariables_1.toEnvironmentVariables({
                    configuration: commandDispatcherConfiguration,
                    configurationDefinition: configurationDefinition_1.configurationDefinition
                })
            });
            awaitCommandClient = new Client_1.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: commandDispatcherSocket,
                path: '/await-command/v2',
                createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
            });
            commandConfiguration = {
                ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_2.configurationDefinition }),
                applicationDirectory,
                portOrSocket: socket,
                healthPortOrSocket: healthSocket,
                commandDispatcherHostName: 'localhost',
                commandDispatcherPortOrSocket: commandDispatcherSocket,
                commandDispatcherRetries: 0,
                identityProviders
            };
            stopProcess = await startProcess_1.startProcess({
                runtime: 'microservice',
                name: 'command',
                enableDebugMode: false,
                portOrSocket: healthSocket,
                env: toEnvironmentVariables_1.toEnvironmentVariables({ configuration: commandConfiguration, configurationDefinition: configurationDefinition_2.configurationDefinition })
            });
            handleCommandClient = new Client_2.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: socket,
                path: '/command/v2'
            });
        });
        teardown(async () => {
            if (stopProcess) {
                await stopProcess();
            }
            if (stopCommandDispatcherProcess) {
                await stopCommandDispatcherProcess();
            }
            stopProcess = undefined;
            stopCommandDispatcherProcess = undefined;
        });
        suite('getHealth', () => {
            test('is using the health API.', async () => {
                const healthClient = new Client_3.Client({
                    protocol: 'http',
                    hostName: 'localhost',
                    portOrSocket: healthSocket,
                    path: '/health/v2'
                });
                await assertthat_1.assert.that(async () => healthClient.getHealth()).is.not.throwingAsync();
            });
        });
        suite('postCommand', () => {
            test('sends commands to the correct endpoint at the command dispatcher.', async () => {
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
                });
                await handleCommandClient.postCommand({ command });
                const result = await awaitCommandClient.awaitItem();
                assertthat_1.assert.that(result.item).is.atLeast({
                    ...command,
                    metadata: {
                        client: {
                            user: { id: 'anonymous', claims: { sub: 'anonymous' } }
                        },
                        initiator: {
                            user: { id: 'anonymous', claims: { sub: 'anonymous' } }
                        }
                    }
                });
            });
            test('fails if sending the given command to the command dispatcher fails.', async () => {
                if (stopProcess) {
                    await stopProcess();
                }
                [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
                stopProcess = await startProcess_1.startProcess({
                    runtime: 'microservice',
                    name: 'command',
                    enableDebugMode: false,
                    portOrSocket: healthSocket,
                    env: toEnvironmentVariables_1.toEnvironmentVariables({
                        configuration: {
                            ...commandConfiguration,
                            commandDispatcherHostName: 'non-existent',
                            commandDispatcherPortOrSocket: '/non-existent/socket',
                            portOrSocket: socket,
                            healthPortOrSocket: healthSocket
                        },
                        configurationDefinition: configurationDefinition_2.configurationDefinition
                    })
                });
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
                });
                await assertthat_1.assert.that(async () => {
                    await handleCommandClient.postCommand({ command });
                }).is.throwingAsync();
            });
        });
        suite('cancelCommand', () => {
            test('sends a cancel request to the correct endpoint at the command dispatcher.', async () => {
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
                });
                const { id } = await handleCommandClient.postCommand({ command });
                const commandIdentifier = {
                    aggregateIdentifier: command.aggregateIdentifier,
                    name: command.name,
                    id
                };
                await handleCommandClient.cancelCommand({ commandIdentifier });
                const awaitItemPromise = awaitCommandClient.awaitItem();
                const shortSleep = sleep_1.sleep({ ms: 100 });
                const result = await Promise.race([awaitItemPromise, shortSleep]);
                assertthat_1.assert.that(result).is.undefined();
            });
            test('fails if sending the cancel request to the command dispatcher fails.', async () => {
                if (stopProcess) {
                    await stopProcess();
                }
                [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
                stopProcess = await startProcess_1.startProcess({
                    runtime: 'microservice',
                    name: 'command',
                    enableDebugMode: false,
                    portOrSocket: healthSocket,
                    env: toEnvironmentVariables_1.toEnvironmentVariables({
                        configuration: {
                            ...commandConfiguration,
                            commandDispatcherHostName: 'non-existent',
                            commandDispatcherPortOrSocket: '/non-existent/socket',
                            portOrSocket: socket,
                            healthPortOrSocket: healthSocket
                        },
                        configurationDefinition: configurationDefinition_2.configurationDefinition
                    })
                });
                const commandIdentifier = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4()
                };
                await assertthat_1.assert.that(async () => {
                    await handleCommandClient.cancelCommand({ commandIdentifier });
                }).is.throwingAsync();
            });
        });
    });
    suite('with retries failing', function () {
        this.timeout(10000);
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' }), commandDispatcherRetries = 5, identityProviders = [{ issuer: 'https://token.invalid', certificate: certificateDirectory }];
        let commandConfiguration, commandDispatcherSocket, handleCommandClient, healthSocket, requestCount, socket, stopProcess;
        setup(async () => {
            [socket, healthSocket, commandDispatcherSocket] = await getSocketPaths_1.getSocketPaths({ count: 3 });
            commandConfiguration = {
                ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_2.configurationDefinition }),
                applicationDirectory,
                portOrSocket: socket,
                healthPortOrSocket: healthSocket,
                commandDispatcherHostName: 'localhost',
                commandDispatcherPortOrSocket: commandDispatcherSocket,
                commandDispatcherRetries,
                identityProviders
            };
            requestCount = 0;
            await startCatchAllServer_1.startCatchAllServer({
                portOrSocket: commandDispatcherSocket,
                onRequest(req, res) {
                    requestCount += 1;
                    res.status(500).end();
                }
            });
            stopProcess = await startProcess_1.startProcess({
                runtime: 'microservice',
                name: 'command',
                enableDebugMode: false,
                portOrSocket: healthSocket,
                env: toEnvironmentVariables_1.toEnvironmentVariables({ configuration: commandConfiguration, configurationDefinition: configurationDefinition_2.configurationDefinition })
            });
            handleCommandClient = new Client_2.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: socket,
                path: '/command/v2'
            });
        });
        teardown(async () => {
            if (stopProcess) {
                await stopProcess();
            }
            stopProcess = undefined;
        });
        test('retries as many times as configured and then crashes.', async () => {
            const command = new Command_1.Command({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                },
                name: 'execute',
                data: { strategy: 'succeed' }
            });
            await assertthat_1.assert.that(async () => await handleCommandClient.postCommand({ command })).is.throwingAsync();
            assertthat_1.assert.that(requestCount).is.equalTo(commandDispatcherRetries + 1);
        });
    });
    suite('with retries succeeding', function () {
        this.timeout(10000);
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' }), commandDispatcherRetries = 5, identityProviders = [{ issuer: 'https://token.invalid', certificate: certificateDirectory }], succeedAfterTries = 3;
        let commandConfiguration, commandDispatcherSocket, handleCommandClient, healthSocket, requestCount, socket, stopProcess;
        setup(async () => {
            [socket, healthSocket, commandDispatcherSocket] = await getSocketPaths_1.getSocketPaths({ count: 3 });
            commandConfiguration = {
                ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_2.configurationDefinition }),
                applicationDirectory,
                portOrSocket: socket,
                healthPortOrSocket: healthSocket,
                commandDispatcherHostName: 'localhost',
                commandDispatcherPortOrSocket: commandDispatcherSocket,
                commandDispatcherRetries,
                identityProviders
            };
            requestCount = 0;
            await startCatchAllServer_1.startCatchAllServer({
                portOrSocket: commandDispatcherSocket,
                onRequest(req, res) {
                    requestCount += 1;
                    if (requestCount < succeedAfterTries) {
                        return res.status(500).end();
                    }
                    res.status(200).end();
                }
            });
            stopProcess = await startProcess_1.startProcess({
                runtime: 'microservice',
                name: 'command',
                enableDebugMode: false,
                portOrSocket: healthSocket,
                env: toEnvironmentVariables_1.toEnvironmentVariables({ configuration: commandConfiguration, configurationDefinition: configurationDefinition_2.configurationDefinition })
            });
            handleCommandClient = new Client_2.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: socket,
                path: '/command/v2'
            });
        });
        teardown(async () => {
            if (stopProcess) {
                await stopProcess();
            }
            stopProcess = undefined;
        });
        test('retries and succeeds at some point.', async () => {
            const command = new Command_1.Command({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                },
                name: 'execute',
                data: { strategy: 'succeed' }
            });
            await handleCommandClient.postCommand({ command });
            assertthat_1.assert.that(requestCount).is.equalTo(succeedAfterTries);
        });
    });
});
//# sourceMappingURL=processTests.js.map