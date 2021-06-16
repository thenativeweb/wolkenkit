"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const Client_1 = require("../../../../lib/apis/subscribeNotifications/http/v2/Client");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../lib/messaging/pubSub/createSubscriber");
const http_1 = require("../../../../lib/apis/subscribeNotifications/http");
const getApplicationDescription_1 = require("../../../../lib/common/application/getApplicationDescription");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
suite('subscribeNotifications/http/Client', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base', language: 'javascript' }), channelForNotifications = 'notifications', heartbeatInterval = 90000, identityProviders = [identityProvider_1.identityProvider];
    let api, application, publisher, subscriber;
    setup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        publisher = await createPublisher_1.createPublisher({ type: 'InMemory' });
        subscriber = await createSubscriber_1.createSubscriber({ type: 'InMemory' });
        ({ api } = await http_1.getApi({
            application,
            corsOrigin: '*',
            identityProviders,
            subscriber,
            channelForNotifications,
            heartbeatInterval
        }));
    });
    suite('/v2', () => {
        suite('getDescription', () => {
            test(`returns the notifications' descriptions.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getDescription();
                const { notifications: notificationsDescription } = getApplicationDescription_1.getApplicationDescription({
                    application
                });
                // Convert and parse as JSON, to get rid of any values that are undefined.
                // This is what the HTTP API does internally, and here we need to simulate
                // this to make things work.
                const expectedNotificationsDescription = JSON.parse(JSON.stringify(notificationsDescription));
                assertthat_1.assert.that(data).is.equalTo(expectedNotificationsDescription);
            });
        });
        suite('getNotifications', () => {
            test('delivers a single notification.', async () => {
                const notification = { name: 'flowSampleFlowUpdated', data: {} };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    await publisher.publish({ channel: channelForNotifications, message: notification });
                }, 100);
                const data = await client.getNotifications();
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo(notification);
                            resolve();
                        }
                    ], true));
                });
            });
            test('delivers multiple notifications.', async () => {
                const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: true } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
                    await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
                }, 100);
                const data = await client.getNotifications();
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: notificationFirst.name, data: notificationFirst.data });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
                            resolve();
                        }
                    ], true));
                });
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map