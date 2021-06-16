"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const configurationDefinition_1 = require("../../../../../lib/runtimes/microservice/processes/notification/configurationDefinition");
const getDefaultConfiguration_1 = require("../../../../../lib/runtimes/shared/getDefaultConfiguration");
const getSocketPaths_1 = require("../../../../shared/getSocketPaths");
const Client_1 = require("../../../../../lib/apis/getHealth/http/v2/Client");
const configurationDefinition_2 = require("../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition");
const Client_2 = require("../../../../../lib/apis/publishMessage/http/v2/Client");
const startProcess_1 = require("../../../../../lib/runtimes/shared/startProcess");
const Client_3 = require("../../../../../lib/apis/subscribeNotifications/http/v2/Client");
const toEnvironmentVariables_1 = require("../../../../../lib/runtimes/shared/toEnvironmentVariables");
const wait_for_signals_1 = require("wait-for-signals");
suite('notification process', function () {
    this.timeout(60000);
    const pubsubChannelForNotifications = 'notifications';
    let healthSocket, publisherHealthSocket, publisherSocket, publishMessageClient, socket, stopProcess, stopProcessPublisher, subscribeNotificationsClient;
    setup(async () => {
        [socket, healthSocket, publisherSocket, publisherHealthSocket] = await getSocketPaths_1.getSocketPaths({ count: 4 });
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
        publishMessageClient = new Client_2.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: publisherSocket,
            path: '/publish/v2'
        });
        const configuration = {
            ...getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition: configurationDefinition_1.configurationDefinition }),
            healthPortOrSocket: healthSocket,
            portOrSocket: socket,
            pubSubOptions: {
                channelForNotifications: pubsubChannelForNotifications,
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
            name: 'notification',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: toEnvironmentVariables_1.toEnvironmentVariables({
                configuration,
                configurationDefinition: configurationDefinition_1.configurationDefinition
            })
        });
        subscribeNotificationsClient = new Client_3.Client({
            protocol: 'http',
            hostName: 'localhost',
            portOrSocket: socket,
            path: '/notifications/v2'
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
    suite('notifications', () => {
        test('streams notifications that come from the publisher.', async () => {
            const notification = { name: 'complex', data: { message: '1' }, metadata: { public: true } };
            setTimeout(async () => {
                await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notification });
            }, 50);
            const messageStream = await subscribeNotificationsClient.getNotifications();
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            messageStream.on('error', async (err) => {
                await collector.fail(err);
            });
            messageStream.pipe(asJsonStream_1.asJsonStream([
                async (receivedEvent) => {
                    assertthat_1.assert.that(receivedEvent).is.equalTo({ name: notification.name, data: notification.data });
                    await collector.signal();
                }
            ], true));
            await collector.promise;
        });
        test('only streams authorized notifications.', async () => {
            const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: false } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
            setTimeout(async () => {
                await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notificationFirst });
                await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notificationSecond });
            }, 50);
            const messageStream = await subscribeNotificationsClient.getNotifications();
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            messageStream.on('error', async (err) => {
                await collector.fail(err);
            });
            messageStream.pipe(asJsonStream_1.asJsonStream([
                async (receivedEvent) => {
                    assertthat_1.assert.that(receivedEvent).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
                    await collector.signal();
                }
            ], true));
            await collector.promise;
        });
        test('drops invalid notifications.', async () => {
            const notificationFirst = { name: 'complex', data: { foo: 'bar' }, metadata: { public: true } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
            setTimeout(async () => {
                await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notificationFirst });
                await publishMessageClient.postMessage({ channel: pubsubChannelForNotifications, message: notificationSecond });
            }, 50);
            const messageStream = await subscribeNotificationsClient.getNotifications();
            const collector = wait_for_signals_1.waitForSignals({ count: 1 });
            messageStream.on('error', async (err) => {
                await collector.fail(err);
            });
            messageStream.pipe(asJsonStream_1.asJsonStream([
                async (receivedEvent) => {
                    assertthat_1.assert.that(receivedEvent).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
                    await collector.signal();
                }
            ], true));
            await collector.promise;
        });
    });
});
//# sourceMappingURL=processTests.js.map