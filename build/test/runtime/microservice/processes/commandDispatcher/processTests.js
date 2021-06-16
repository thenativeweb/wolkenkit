"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const Client_1 = require("../../../../../lib/apis/awaitItem/http/v2/Client");
const buildCommandWithMetadata_1 = require("../../../../../lib/common/utils/test/buildCommandWithMetadata");
const CommandWithMetadata_1 = require("../../../../../lib/common/elements/CommandWithMetadata");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const Client_2 = require("../../../../../lib/apis/handleCommandWithMetadata/http/v2/Client");
const Client_3 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const uuid_1 = require("uuid");
suite('command dispatcher process', function () {
    this.timeout(60000);
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const queueLockExpirationTime = 600;
    let awaitCommandClient, commandDispatcherConfiguration, handleCommandWithMetadataClient, healthSocket, socket, stopProcess;
    setup(async () => {
        [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
        commandDispatcherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            applicationDirectory,
            priorityQueueStoreOptions: { type: 'InMemory', expirationTime: queueLockExpirationTime },
            portOrSocket: socket,
            healthPortOrSocket: healthSocket
        };
        stopProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'commandDispatcher',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({ configuration: commandDispatcherConfiguration, configurationDefinition: configurationDefinition_1.configurationDefinition })
        });
        awaitCommandClient = new Client_1.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/await-command/v2',
            createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
        });
        handleCommandWithMetadataClient = new Client_2.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/handle-command/v2'
        });
    });
    teardown(async () => {
        if (stopProcess) {
            await stopProcess();
        }
        stopProcess = undefined;
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
    suite('awaitCommand', () => {
        test('delivers a command that is sent to /handle-command/v2.', async () => {
            const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier: {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                },
                name: 'execute',
                data: {
                    strategy: 'succeed'
                }
            });
            await handleCommandWithMetadataClient.postCommand({ command });
            const lock = await awaitCommandClient.awaitItem();
            assertthat_1.assert.that(lock.item).is.equalTo(command);
        });
    });
});
//# sourceMappingURL=processTests.js.map