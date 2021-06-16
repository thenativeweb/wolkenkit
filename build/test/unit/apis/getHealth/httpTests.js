"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const http_1 = require("../../../../lib/apis/getHealth/http");
const validate_value_1 = require("validate-value");
const runAsServer_1 = require("../../../shared/http/runAsServer");
suite('getHealth/http', () => {
    suite('/v2', () => {
        suite('GET /', () => {
            let api;
            setup(async () => {
                ({ api } = await http_1.getApi({ corsOrigin: '*' }));
            });
            test('returns 200.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: '/v2/'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test('returns application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { headers } = await client({
                    method: 'get',
                    url: '/v2/'
                });
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/json; charset=utf-8');
            });
            test('returns health information.', async () => {
                const parser = new validate_value_1.Parser({
                    type: 'object',
                    properties: {
                        host: {
                            type: 'object',
                            properties: {
                                architecture: { type: 'string' },
                                platform: { type: 'string' }
                            },
                            required: ['architecture', 'platform'],
                            additionalProperties: false
                        },
                        node: {
                            type: 'object',
                            properties: {
                                version: { type: 'string' }
                            },
                            required: ['version'],
                            additionalProperties: false
                        },
                        process: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                uptime: { type: 'number' }
                            },
                            required: ['id', 'uptime'],
                            additionalProperties: false
                        },
                        cpuUsage: {
                            type: 'object',
                            properties: {
                                user: { type: 'number' },
                                system: { type: 'number' }
                            },
                            required: ['user', 'system'],
                            additionalProperties: false
                        },
                        memoryUsage: {
                            type: 'object',
                            properties: {
                                rss: { type: 'number' },
                                maxRss: { type: 'number' },
                                heapTotal: { type: 'number' },
                                heapUsed: { type: 'number' },
                                external: { type: 'number' }
                            },
                            required: ['rss', 'maxRss', 'heapTotal', 'heapUsed', 'external'],
                            additionalProperties: false
                        },
                        diskUsage: {
                            type: 'object',
                            properties: {
                                read: { type: 'number' },
                                write: { type: 'number' }
                            },
                            required: ['read', 'write'],
                            additionalProperties: false
                        }
                    },
                    required: ['host', 'node', 'process', 'cpuUsage', 'memoryUsage', 'diskUsage'],
                    additionalProperties: false
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/'
                });
                assertthat_1.assert.that(parser.parse(data)).is.not.anError();
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map