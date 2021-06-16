"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/view/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const getTestApplicationDirectory_1 = require("../../../../shared/applications/getTestApplicationDirectory");
const Client_1 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const configurationDefinition_2 = require("../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition");
const Client_2 = require("../../../../../lib/apis/publishMessage/http/v2/Client");
const Client_3 = require("../../../../../lib/apis/queryView/http/v2/Client");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const Client_4 = require("../../../../../lib/apis/subscribeMessages/http/v2/Client");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const wait_for_signals_1 = require("wait-for-signals");
suite('view process', function () {
    this.timeout(60000);
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withHardcodedViews', language: 'javascript' }), pubSubChannelForNotifications = 'notifications';
    let healthSocket, publisherHealthSocket, publisherSocket, publishMessagesClient, queryViewsClient, socket, stopProcess, stopProcessPublisher, subscribeMessagesClient;
    setup(async () => {
        [healthSocket, socket, publisherHealthSocket, publisherSocket] = await getSocketPaths_1.getSocketPaths({ count: 4 });
        const publisherConfiguration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_2.configurationDefinition }),
            portOrSocket: publisherSocket,
            healthPortOrSocket: publisherHealthSocket
        };
        stopProcessPublisher = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'publisher',
            enableDebugMode: false,
            portOrSocket: publisherHealthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration: publisherConfiguration,
                configurationDefinition: configurationDefinition_2.configurationDefinition
            })
        });
        publishMessagesClient = new Client_2.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: publisherSocket,
            path: '/publish/v2'
        });
        subscribeMessagesClient = new Client_4.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: publisherSocket,
            path: '/subscribe/v2'
        });
        const configuration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            applicationDirectory,
            healthPortOrSocket: healthSocket,
            portOrSocket: socket,
            pubSubOptions: {
                channelForNotifications: pubSubChannelForNotifications,
                publisher: {
                    type: 'Http',
                    protocol: 'http',
                    hostName: 'localhost',
                    portOrSocket: publisherSocket,
                    path: '/publish/v2'
                },
                subscriber: {
                    type: 'Http',
                    protocol: 'http',
                    hostName: 'localhost',
                    portOrSocket: publisherSocket,
                    path: '/subscribe/v2'
                }
            }
        };
        stopProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'view',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration,
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        queryViewsClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/views/v2'
        });
    });
    teardown(async () => {
        if (stopProcess) {
            await stopProcess();
        }
        if (stopProcessPublisher) {
            await stopProcessPublisher();
        }
        stopProcess = undefined;
        stopProcessPublisher = undefined;
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
    suite('views', () => {
        test('queries the views.', async () => {
            const resultStream = await queryViewsClient.queryStream({
                viewName: 'sampleView',
                queryName: 'hardcoded'
            });
            const resultItems = [];
            for await (const resultItem of resultStream) {
                resultItems.push(resultItem);
            }
            assertthat_1.assert.that(resultItems).is.equalTo([
                { value: 'foo' },
                { value: 'bar' },
                { value: 'baz' }
            ]);
        });
    });
    suite('notificationSubscribers', () => {
        test('react to notifications and publish notifications.', async () => {
            const messageStreamNotification = await subscribeMessagesClient.getMessages({
                channel: pubSubChannelForNotifications
            });
            await publishMessagesClient.postMessage({
                channel: pubSubChannelForNotifications,
                message: {
                    name: 'flowSampleFlowUpdated',
                    data: {}
                }
            });
            const counter = wait_for_signals_1.waitForSignals({ count: 2 });
            messageStreamNotification.on('error', async (err) => {
                await counter.fail(err);
            });
            messageStreamNotification.pipe(asJsonStream_1.asJsonStream([
                async (data) => {
                    try {
                        assertthat_1.assert.that(data).is.atLeast({
                            name: 'flowSampleFlowUpdated',
                            data: {}
                        });
                        await counter.signal();
                    }
                    catch (ex) {
                        await counter.fail(ex);
                    }
                },
                async (data) => {
                    try {
                        assertthat_1.assert.that(data).is.atLeast({
                            name: 'viewSampleViewUpdated',
                            data: {}
                        });
                        await counter.signal();
                    }
                    catch (ex) {
                        await counter.fail(ex);
                    }
                }
            ], true));
            await counter.promise;
        });
    });
});
//# sourceMappingURL=processTests.js.map