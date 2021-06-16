"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../lib/messaging/pubSub/createSubscriber");
const http_1 = require("../../../../lib/apis/subscribeNotifications/http");
const getApplicationDescription_1 = require("../../../../lib/common/application/getApplicationDescription");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const sleep_1 = require("../../../../lib/common/utils/sleep");
suite('subscribeNotifications/http', function () {
    this.timeout(5000);
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
        suite('GET /description', () => {
            test('returns the status code 200.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: '/v2/description'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test('returns application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { headers } = await client({
                    method: 'get',
                    url: '/v2/description'
                });
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/json; charset=utf-8');
            });
            test('returns the notifications description.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/description'
                });
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
        suite('GET /', () => {
            test('delivers a single notification.', async () => {
                const notification = {
                    name: 'flowSampleFlowUpdated',
                    data: {}
                };
                setTimeout(async () => {
                    await publisher.publish({ channel: channelForNotifications, message: notification });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: `/v2/`,
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo(notification);
                            resolve();
                        }
                    ]));
                });
            });
            test('delivers only authorized notifications.', async () => {
                const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: false } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
                setTimeout(async () => {
                    await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
                    await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: `/v2/`,
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({
                                name: notificationSecond.name,
                                data: notificationSecond.data
                            });
                            resolve();
                        }
                    ]));
                });
            });
            test('does not deliver unknown notifications.', async () => {
                const notificationFirst = { name: 'non-existent', data: {} }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
                setTimeout(async () => {
                    await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
                    await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: `/v2/`,
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
                            resolve();
                        }
                    ]));
                });
            });
            test('does not deliver invalid notifications.', async () => {
                const notificationFirst = { name: 'complex', data: { foo: 'bar' } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
                setTimeout(async () => {
                    await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
                    await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: `/v2/`,
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
                            resolve();
                        }
                    ]));
                });
            });
            test('delivers multiple notifications.', async () => {
                const notificationFirst = { name: 'complex', data: { message: '1' }, metadata: { public: true } }, notificationSecond = { name: 'complex', data: { message: '2' }, metadata: { public: true } };
                setTimeout(async () => {
                    await publisher.publish({ channel: channelForNotifications, message: notificationFirst });
                    await publisher.publish({ channel: channelForNotifications, message: notificationSecond });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: `/v2/`,
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: notificationFirst.name, data: notificationFirst.data });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: notificationSecond.name, data: notificationSecond.data });
                            resolve();
                        }
                    ]));
                });
            });
            test('gracefully handles connections that get closed by the client.', async () => {
                const notification = { name: 'flowSampleFlowUpdated', data: {} };
                const { client } = await runAsServer_1.runAsServer({ app: api });
                try {
                    await client({
                        method: 'get',
                        url: `/v2/`,
                        responseType: 'stream',
                        timeout: 100
                    });
                }
                catch (ex) {
                    if (ex.code !== 'ECONNABORTED') {
                        throw ex;
                    }
                    // Ignore aborted connections, since that's what we want to achieve
                    // here.
                }
                await sleep_1.sleep({ ms: 50 });
                await assertthat_1.assert.that(async () => {
                    await publisher.publish({ channel: channelForNotifications, message: notification });
                }).is.not.throwingAsync();
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map