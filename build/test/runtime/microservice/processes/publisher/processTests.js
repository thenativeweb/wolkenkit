"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const Client_1 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition");
const Client_2 = require("../../../../../lib/apis/publishMessage/http/v2/Client");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const Client_3 = require("../../../../../lib/apis/subscribeMessages/http/v2/Client");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const wait_for_signals_1 = require("wait-for-signals");
suite('publisher process', function () {
    this.timeout(60000);
    let healthSocket, publishMessageClient, socket, stopProcess, subscribeMessagesClient;
    setup(async () => {
        [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
        const publisherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            portOrSocket: socket,
            healthPortOrSocket: healthSocket
        };
        stopProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'publisher',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: publisherConfiguration,
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        publishMessageClient = new Client_2.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/publish/v2'
        });
        subscribeMessagesClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/subscribe/v2'
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
            const healthClient = new Client_1.Client({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: healthSocket,
                path: '/health/v2'
            });
            await assertthat_1.assert.that(async () => healthClient.getHealth()).is.not.throwingAsync();
        });
    });
    suite('publishMessage', () => {
        test('forwards messages to subscribers.', async () => {
            const channel = 'messages', message = { text: 'Hello world!' };
            setTimeout(async () => {
                await publishMessageClient.postMessage({ channel, message });
            }, 50);
            const messageStream = await subscribeMessagesClient.getMessages({ channel });
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            messageStream.on('error', async (err) => {
                await collector.fail(err);
            });
            messageStream.pipe(asJsonStream_1.asJsonStream([
                async (receivedEvent) => {
                    assertthat_1.assert.that(receivedEvent).is.equalTo(message);
                    await collector.signal();
                }
            ], true));
            await collector.promise;
        });
    });
});
//# sourceMappingURL=processTests.js.map