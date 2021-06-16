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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const http_1 = require("../../../../lib/apis/queryView/http");
const getApplicationDescription_1 = require("../../../../lib/common/application/getApplicationDescription");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const stream_to_string_1 = __importDefault(require("stream-to-string"));
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('queryView/http', () => {
    const identityProviders = [identityProvider_1.identityProvider];
    suite('/v2', () => {
        let api, application;
        setup(async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withComplexQueries', language: 'javascript' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
            ({ api } = await http_1.getApi({
                application,
                corsOrigin: '*',
                identityProviders
            }));
        });
        suite('GET /description', () => {
            test('returns 200.', async () => {
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
            test('returns the commands description.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/description'
                });
                const { views: viewsDescription } = getApplicationDescription_1.getApplicationDescription({
                    application
                });
                // Convert and parse as JSON, to get rid of any values that are undefined.
                // This is what the HTTP API does internally, and here we need to simulate
                // this to make things work.
                const expectedViewsDescription = JSON.parse(JSON.stringify(viewsDescription));
                assertthat_1.assert.that(data).is.equalTo(expectedViewsDescription);
            });
        });
        suite('GET /:viewName/stream/:queryName', () => {
            test('returns 400 if the view name does not exist.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/nonExistent/stream/all',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ViewNotFound.code,
                    message: `View 'nonExistent' not found.`
                });
            });
            test('returns 400 if the query handler name does not exist.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/stream/nonExistent',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.QueryHandlerNotFound.code,
                    message: `Query handler 'sampleView.nonExistent' not found.`
                });
            });
            test('returns 400 if the query handler matches a value query, not a stream query.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/stream/first',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.QueryHandlerTypeMismatch.code,
                    message: `Can not query for a stream on a value query handler.`
                });
            });
            test('returns 400 if the options do not match the options schema.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/stream/streamWithOptions',
                    validateStatus() {
                        return true;
                    },
                    params: { foo: 'bar' },
                    paramsSerializer(params) {
                        return Object.entries(params).
                            map(([key, value]) => `${key}=${JSON.stringify(value)}`).
                            join('&');
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.QueryOptionsInvalid.code,
                    message: `Missing required property: filter (at queryHandlerOptions.filter).`
                });
            });
            test('returns 200 and streams the result items.', async () => {
                const domainEvents = [
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        id: uuid_1.v4()
                    },
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'not-executed',
                        id: uuid_1.v4()
                    }
                ];
                application.infrastructure.ask.viewStore.domainEvents = domainEvents;
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/stream/all',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const streamContent = await stream_to_string_1.default(data);
                const parsedStreamContent = streamContent.
                    split('\n').
                    filter((line) => line !== '').
                    map((line) => JSON.parse(line));
                assertthat_1.assert.that(parsedStreamContent).is.equalTo(domainEvents);
            });
            test('returns 200 and omits items that do not match the item schema.', async () => {
                const domainEvents = [
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        id: uuid_1.v4()
                    },
                    {
                        foo: 'bar'
                    }
                ];
                application.infrastructure.ask.viewStore.domainEvents = domainEvents;
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/stream/all',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const streamContent = await stream_to_string_1.default(data);
                const parsedStreamContent = streamContent.
                    split('\n').
                    filter((line) => line !== '').
                    map((line) => JSON.parse(line));
                assertthat_1.assert.that(parsedStreamContent).is.equalTo([domainEvents[0]]);
            });
            test('returns 200 and omits unauthorized items.', async () => {
                const domainEvents = [
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        id: uuid_1.v4()
                    },
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        id: uuid_1.v4()
                    }
                ];
                application.infrastructure.ask.viewStore.domainEvents = domainEvents;
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/stream/streamAuthorized',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const streamContent = await stream_to_string_1.default(data);
                const parsedStreamContent = streamContent.
                    split('\n').
                    filter((line) => line !== '').
                    map((line) => JSON.parse(line));
                assertthat_1.assert.that(parsedStreamContent).is.equalTo([]);
            });
            test('returns 200 and respects the given options.', async () => {
                const domainEvents = [
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        id: uuid_1.v4()
                    },
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'not-executed',
                        id: uuid_1.v4()
                    }
                ];
                application.infrastructure.ask.viewStore.domainEvents = domainEvents;
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/stream/streamWithOptions',
                    params: { filter: { domainEventName: 'executed' } },
                    paramsSerializer(params) {
                        return Object.entries(params).
                            map(([key, value]) => `${key}=${JSON.stringify(value)}`).
                            join('&');
                    },
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const streamContent = await stream_to_string_1.default(data);
                const parsedStreamContent = streamContent.
                    split('\n').
                    filter((line) => line !== '').
                    map((line) => JSON.parse(line));
                assertthat_1.assert.that(parsedStreamContent).is.equalTo([domainEvents[0]]);
            });
        });
        suite('GET /:viewName/value/:queryName', () => {
            test('returns 400 if the view name does not exist.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/nonExistent/value/first',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ViewNotFound.code,
                    message: `View 'nonExistent' not found.`
                });
            });
            test('returns 400 if the query handler name does not exist.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/value/nonExistent',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.QueryHandlerNotFound.code,
                    message: `Query handler 'sampleView.nonExistent' not found.`
                });
            });
            test('returns 400 if the query handler matches a stream query, not a value query.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/value/all',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.QueryHandlerTypeMismatch.code,
                    message: `Can not query for a stream on a value query handler.`
                });
            });
            test('returns 400 if the options do not match the options schema.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/value/valueWithOptions',
                    validateStatus() {
                        return true;
                    },
                    params: { foo: 'bar' },
                    paramsSerializer(params) {
                        return Object.entries(params).
                            map(([key, value]) => `${key}=${JSON.stringify(value)}`).
                            join('&');
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.QueryOptionsInvalid.code,
                    message: `Missing required property: filter (at queryHandlerOptions.filter).`
                });
            });
            test('returns 200 and the result item.', async () => {
                const domainEvents = [
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        id: uuid_1.v4()
                    },
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'not-executed',
                        id: uuid_1.v4()
                    }
                ];
                application.infrastructure.ask.viewStore.domainEvents = domainEvents;
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/value/first'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo(domainEvents[0]);
            });
            test('returns 404 if the query does not return a result.', async () => {
                application.infrastructure.ask.viewStore.domainEvents = [];
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: '/v2/sampleView/value/notFound',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(404);
            });
            test('returns 404 if the result item does not match the item schema.', async () => {
                const domainEvents = [
                    {
                        foo: 'bar'
                    }
                ];
                application.infrastructure.ask.viewStore.domainEvents = domainEvents;
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: '/v2/sampleView/value/first',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(404);
            });
            test('returns 404 if the query is not authorized.', async () => {
                application.infrastructure.ask.viewStore.domainEvents = [];
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: '/v2/sampleView/value/valueAuthorized',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(404);
            });
            test('returns 200 and respects the given options.', async () => {
                const domainEvents = [
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        id: uuid_1.v4()
                    },
                    {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'not-executed',
                        id: uuid_1.v4()
                    }
                ];
                application.infrastructure.ask.viewStore.domainEvents = domainEvents;
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/sampleView/value/valueWithOptions',
                    params: { filter: { domainEventName: 'executed' } },
                    paramsSerializer(params) {
                        return Object.entries(params).
                            map(([key, value]) => `${key}=${JSON.stringify(value)}`).
                            join('&');
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo(domainEvents[0]);
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map