"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const http_1 = require("../../../../lib/apis/getStatic/http");
const path_1 = __importDefault(require("path"));
const runAsServer_1 = require("../../../shared/http/runAsServer");
suite('static/http', () => {
    const directory = path_1.default.join(__dirname, '..', '..', '..', 'shared', 'serveStatic');
    suite('GET /', () => {
        let api;
        setup(async () => {
            ({ api } = await http_1.getApi({ corsOrigin: '*', directory }));
        });
        test('serves static content.', async () => {
            const { client } = await runAsServer_1.runAsServer({ app: api });
            const { status, headers, data } = await client({
                method: 'get',
                url: '/',
                responseType: 'text'
            });
            assertthat_1.assert.that(status).is.equalTo(200);
            assertthat_1.assert.that(headers['content-type']).is.equalTo('text/html; charset=UTF-8');
            assertthat_1.assert.that(data).is.startingWith('<!doctype html>\n<html>');
            assertthat_1.assert.that(data).is.endingWith('</html>\n');
        });
    });
});
//# sourceMappingURL=httpTests.js.map