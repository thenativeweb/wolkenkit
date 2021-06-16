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
const assertthat_1 = require("assertthat");
const Client_1 = require("../../../../lib/apis/publishMessage/http/v2/Client");
const http_1 = require("../../../../lib/apis/publishMessage/http");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('publishMessage/http/Client', () => {
    suite('/v2', () => {
        suite('postMessage', () => {
            let api, receivedMessages;
            setup(async () => {
                receivedMessages = [];
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveMessage({ channel, message }) {
                        receivedMessages.push({ channel, message });
                    }
                }));
            });
            test('sends messages.', async () => {
                const message = { text: 'Hello world!' };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.postMessage({ channel: 'messages', message });
                assertthat_1.assert.that(receivedMessages.length).is.equalTo(1);
                assertthat_1.assert.that(receivedMessages[0]).is.equalTo({ channel: 'messages', message });
            });
            test('throws an error if on received message throws an error.', async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveMessage() {
                        throw new Error('Failed to handle received message.');
                    }
                }));
                const message = { text: 'Hello world!' };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postMessage({ channel: 'messages', message });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code &&
                    ex.message === 'Unknown error.');
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map