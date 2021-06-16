"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const Client_1 = require("../../../../lib/apis/subscribeMessages/http/v2/Client");
const http_1 = require("../../../../lib/apis/subscribeMessages/http");
const runAsServer_1 = require("../../../shared/http/runAsServer");
suite('subscribeMessages/http/Client', () => {
    suite('/v2', () => {
        suite('getMessages', () => {
            let api, publishMessage;
            setup(async () => {
                ({ api, publishMessage } = await http_1.getApi({
                    corsOrigin: '*'
                }));
            });
            test('delivers a single message.', async () => {
                const channel = 'messages', message = { text: 'Hello world!' };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    publishMessage({ channel, message });
                }, 100);
                const data = await client.getMessages({ channel });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo(message);
                            resolve();
                        }
                    ], true));
                });
            });
            test('delivers multiple messages.', async () => {
                const channel = 'messages', messageFirst = { text: 'Hello world!' }, messageSecond = { text: 'Goodbye world!' };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    publishMessage({ channel, message: messageFirst });
                    publishMessage({ channel, message: messageSecond });
                }, 100);
                const data = await client.getMessages({ channel });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo(messageFirst);
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo(messageSecond);
                            resolve();
                        }
                    ], true));
                });
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map