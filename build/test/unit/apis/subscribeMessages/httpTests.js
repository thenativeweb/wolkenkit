"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const http_1 = require("../../../../lib/apis/subscribeMessages/http");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const sleep_1 = require("../../../../lib/common/utils/sleep");
suite('subscribeMessages/http', () => {
    suite('/v2', () => {
        suite('GET /', function () {
            this.timeout(5000);
            let api, publishMessage;
            setup(async () => {
                ({ api, publishMessage } = await http_1.getApi({ corsOrigin: '*' }));
            });
            test('delivers a single message.', async () => {
                const channel = 'messages', message = { text: 'Hello world!' };
                setTimeout(async () => {
                    publishMessage({ channel, message });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: `/v2/${channel}`,
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
                            assertthat_1.assert.that(streamElement).is.equalTo(message);
                            resolve();
                        }
                    ]));
                });
            });
            test('delivers multiple messages.', async () => {
                const channel = 'messages', messageFirst = { text: 'Hello world!' }, messageSecond = { text: 'Goodbye world!' };
                setTimeout(async () => {
                    publishMessage({ channel, message: messageFirst });
                    publishMessage({ channel, message: messageSecond });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: `/v2/${channel}`,
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
                            assertthat_1.assert.that(streamElement).is.equalTo(messageFirst);
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo(messageSecond);
                            resolve();
                        }
                    ]));
                });
            });
            test('gracefully handles connections that get closed by the client.', async () => {
                const channel = 'messages', message = { text: 'Hello world!' };
                const { client } = await runAsServer_1.runAsServer({ app: api });
                try {
                    await client({
                        method: 'get',
                        url: `/v2/${channel}`,
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
                    publishMessage({ channel, message });
                }).is.not.throwingAsync();
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map