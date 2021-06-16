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
const Client_1 = require("../../../../lib/apis/queryView/http/v2/Client");
const http_1 = require("../../../../lib/apis/queryView/http");
const getApplicationDescription_1 = require("../../../../lib/common/application/getApplicationDescription");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('queryView/http/Client', () => {
    const identityProviders = [identityProvider_1.identityProvider];
    let application;
    suite('/v2', () => {
        suiteSetup(async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withComplexQueries' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
        });
        suite('getDescription', () => {
            let api;
            setup(async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    application,
                    identityProviders
                }));
            });
            test('returns the views description.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const description = await client.getDescription();
                const { views: viewsDescription } = getApplicationDescription_1.getApplicationDescription({
                    application
                });
                // Convert and parse as JSON, to get rid of any values that are undefined.
                // This is what the HTTP API does internally, and here we need to simulate
                // this to make things work.
                const expectedViewsDescription = JSON.parse(JSON.stringify(viewsDescription));
                assertthat_1.assert.that(description).is.equalTo(expectedViewsDescription);
            });
        });
        suite('queryStream', () => {
            let api;
            setup(async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    application,
                    identityProviders
                }));
            });
            test('throws an exception if the view name does not exist.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryStream({ viewName: 'nonExistent', queryName: 'all' });
                }).is.throwingAsync((ex) => ex.code === errors.ViewNotFound.code &&
                    ex.message === `View 'nonExistent' not found.`);
            });
            test('throws an exception if the query handler name does not exist.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryStream({ viewName: 'sampleView', queryName: 'nonExistent' });
                }).is.throwingAsync((ex) => ex.code === errors.QueryHandlerNotFound.code &&
                    ex.message === `Query handler 'sampleView.nonExistent' not found.`);
            });
            test('throws an exception if the query handler matches a value query, not a stream query.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryStream({ viewName: 'sampleView', queryName: 'first' });
                }).is.throwingAsync((ex) => ex.code === errors.QueryHandlerTypeMismatch.code);
            });
            test('throws an exception if the options do not match the options schema.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryStream({
                        viewName: 'sampleView',
                        queryName: 'streamWithOptions',
                        queryOptions: { foo: 'bar' }
                    });
                }).is.throwingAsync((ex) => ex.code === errors.QueryOptionsInvalid.code &&
                    ex.message === `Missing required property: filter (at queryHandlerOptions.filter).`);
            });
            test('streams the result items.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const resultStream = await client.queryStream({
                    viewName: 'sampleView',
                    queryName: 'all'
                });
                const resultItems = [];
                for await (const resultItem of resultStream) {
                    resultItems.push(resultItem);
                }
                assertthat_1.assert.that(resultItems).is.equalTo(domainEvents);
            });
            test('streams the result items and omits items that do not match the item schema.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const resultStream = await client.queryStream({
                    viewName: 'sampleView',
                    queryName: 'all'
                });
                const resultItems = [];
                for await (const resultItem of resultStream) {
                    resultItems.push(resultItem);
                }
                assertthat_1.assert.that(resultItems).is.equalTo([domainEvents[0]]);
            });
            test('streams the result items and omits unauthorized items.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const resultStream = await client.queryStream({
                    viewName: 'sampleView',
                    queryName: 'streamAuthorized'
                });
                const resultItems = [];
                for await (const resultItem of resultStream) {
                    resultItems.push(resultItem);
                }
                assertthat_1.assert.that(resultItems).is.equalTo([]);
            });
            test('streams the result items and respects the given options.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const resultStream = await client.queryStream({
                    viewName: 'sampleView',
                    queryName: 'streamWithOptions',
                    queryOptions: { filter: { domainEventName: 'executed' } }
                });
                const resultItems = [];
                for await (const resultItem of resultStream) {
                    resultItems.push(resultItem);
                }
                assertthat_1.assert.that(resultItems).is.equalTo([domainEvents[0]]);
            });
        });
        suite('queryValue', () => {
            let api;
            setup(async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    application,
                    identityProviders
                }));
            });
            test('throws an exception if the view name does not exist.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryValue({ viewName: 'nonExistent', queryName: 'first' });
                }).is.throwingAsync((ex) => ex.code === errors.ViewNotFound.code &&
                    ex.message === `View 'nonExistent' not found.`);
            });
            test('throws an exception if the query handler name does not exist.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryValue({ viewName: 'sampleView', queryName: 'nonExistent' });
                }).is.throwingAsync((ex) => ex.code === errors.QueryHandlerNotFound.code &&
                    ex.message === `Query handler 'sampleView.nonExistent' not found.`);
            });
            test('throws an exception if the query handler matches a stream query, not a value query.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryValue({ viewName: 'sampleView', queryName: 'all' });
                }).is.throwingAsync((ex) => ex.code === errors.QueryHandlerTypeMismatch.code);
            });
            test('throws an exception if the options do not match the options schema.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryValue({
                        viewName: 'sampleView',
                        queryName: 'valueWithOptions',
                        queryOptions: { foo: 'bar' }
                    });
                }).is.throwingAsync((ex) => ex.code === errors.QueryOptionsInvalid.code &&
                    ex.message === `Missing required property: filter (at queryHandlerOptions.filter).`);
            });
            test('returns the result item.', async () => {
                const domainEvents = [
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const queryResultItem = await client.queryValue({
                    viewName: 'sampleView',
                    queryName: 'first'
                });
                assertthat_1.assert.that(queryResultItem).is.equalTo(domainEvents[0]);
            });
            test('throws an exception if the query does not return a result.', async () => {
                application.infrastructure.ask.viewStore.domainEvents = [];
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryValue({
                        viewName: 'sampleView',
                        queryName: 'notFound'
                    });
                }).is.throwingAsync((ex) => ex.code === errors.NotFound.code);
            });
            test('throws an exception if the result item does not match the item schema.', async () => {
                const domainEvents = [
                    {
                        foo: 'bar'
                    }
                ];
                application.infrastructure.ask.viewStore.domainEvents = domainEvents;
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryValue({
                        viewName: 'sampleView',
                        queryName: 'first'
                    });
                }).is.throwingAsync((ex) => ex.code === errors.NotFound.code);
            });
            test('throws an exception if the query is not authorized.', async () => {
                application.infrastructure.ask.viewStore.domainEvents = [];
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.queryValue({
                        viewName: 'sampleView',
                        queryName: 'valueAuthorized'
                    });
                }).is.throwingAsync((ex) => ex.code === errors.NotFound.code);
            });
            test('returns the result item and respects the given options.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const queryResultItem = await client.queryValue({
                    viewName: 'sampleView',
                    queryName: 'valueWithOptions',
                    queryOptions: { filter: { domainEventName: 'executed' } }
                });
                assertthat_1.assert.that(queryResultItem).is.equalTo(domainEvents[0]);
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map