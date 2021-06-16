"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const streamNdjsonMiddleware_1 = require("../../../../lib/apis/base/streamNdjsonMiddleware");
const express_1 = __importDefault(require("express"));
suite('streamNdjson middleware', () => {
    let app;
    setup(async () => {
        app = express_1.default();
        app.use(streamNdjsonMiddleware_1.streamNdjsonMiddleware);
        app.get('/', (req, res) => {
            res.startStream({ heartbeatInterval: 1000 });
        });
    });
    test('returns the status code 200.', async () => {
        const { client } = await runAsServer_1.runAsServer({ app });
        const { status } = await client({
            method: 'get',
            url: '/',
            responseType: 'stream'
        });
        assertthat_1.assert.that(status).is.equalTo(200);
    });
    test('returns the content-type application/x-ndjson.', async () => {
        const { client } = await runAsServer_1.runAsServer({ app });
        const { headers } = await client({
            method: 'get',
            url: '/',
            responseType: 'stream'
        });
        assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
    });
    test('sends a periodic heartbeat.', async () => {
        const { client } = await runAsServer_1.runAsServer({ app });
        const { data } = await client({
            method: 'get',
            url: '/',
            responseType: 'stream'
        });
        await new Promise((resolve, reject) => {
            try {
                data.pipe(asJsonStream_1.asJsonStream([
                    (streamElement) => {
                        assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                    },
                    (streamElement) => {
                        assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        resolve();
                    }
                ]));
            }
            catch (ex) {
                reject(ex);
            }
        });
    });
});
//# sourceMappingURL=streamNdjsonTests.js.map