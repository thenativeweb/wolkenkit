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
const executeStreamQueryHandler_1 = require("../../../../lib/common/domain/executeStreamQueryHandler");
const getClientService_1 = require("../../../../lib/common/services/getClientService");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const uuid_1 = require("uuid");
const stream_1 = require("stream");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('executeStreamQueryHandler', () => {
    let application, clientService;
    setup(async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withComplexQueries', language: 'javascript' });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        clientService = getClientService_1.getClientService({ clientMetadata: {
                ip: '127.0.0.1',
                user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                token: '...'
            } });
    });
    test('throws an exception if the view name does not exist.', async () => {
        const queryHandlerIdentifier = {
            view: { name: 'someView' },
            name: 'all'
        };
        await assertthat_1.assert.that(async () => {
            await executeStreamQueryHandler_1.executeStreamQueryHandler({
                application,
                queryHandlerIdentifier,
                services: {
                    client: clientService
                },
                options: {}
            });
        }).is.throwingAsync((ex) => ex.code === errors.ViewNotFound.code);
    });
    test('throws an exception if the query handler name does not exist.', async () => {
        const queryHandlerIdentifier = {
            view: { name: 'sampleView' },
            name: 'someQueryHandler'
        };
        await assertthat_1.assert.that(async () => {
            await executeStreamQueryHandler_1.executeStreamQueryHandler({
                application,
                queryHandlerIdentifier,
                services: {
                    client: clientService
                },
                options: {}
            });
        }).is.throwingAsync((ex) => ex.code === errors.QueryHandlerNotFound.code);
    });
    test('throws an exception if the query handler matches a value query, not a stream query.', async () => {
        const queryHandlerIdentifier = {
            view: { name: 'sampleView' },
            name: 'first'
        };
        await assertthat_1.assert.that(async () => {
            await executeStreamQueryHandler_1.executeStreamQueryHandler({
                application,
                queryHandlerIdentifier,
                services: {
                    client: clientService
                },
                options: {}
            });
        }).is.throwingAsync((ex) => ex.code === errors.QueryHandlerTypeMismatch.code);
    });
    test('throws an exception if the options do not match the options schema.', async () => {
        const queryHandlerIdentifier = {
            view: { name: 'sampleView' },
            name: 'streamWithOptions'
        };
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
        await assertthat_1.assert.that(async () => {
            await executeStreamQueryHandler_1.executeStreamQueryHandler({
                application,
                queryHandlerIdentifier,
                services: { client: clientService },
                options: {}
            });
        }).is.throwingAsync((ex) => ex.code === errors.QueryOptionsInvalid.code);
    });
    test('streams the result items.', async () => {
        const queryHandlerIdentifier = {
            view: { name: 'sampleView' },
            name: 'all'
        };
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
        const queryResultStream = await executeStreamQueryHandler_1.executeStreamQueryHandler({
            application,
            queryHandlerIdentifier,
            services: { client: clientService },
            options: {}
        });
        const resultViewItems = [];
        for await (const item of queryResultStream) {
            resultViewItems.push(item);
        }
        assertthat_1.assert.that(resultViewItems).is.equalTo(domainEvents);
    });
    test('streams the result items and omits items that do not match the item schema.', async () => {
        const queryHandlerIdentifier = {
            view: { name: 'sampleView' },
            name: 'all'
        };
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
        const queryResultStream = await executeStreamQueryHandler_1.executeStreamQueryHandler({
            application,
            queryHandlerIdentifier,
            services: { client: clientService },
            options: {}
        });
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        stream_1.pipeline(queryResultStream, passThrough, async () => {
            // Intentionally left blank.
        });
        const resultViewItems = [];
        for await (const item of queryResultStream) {
            resultViewItems.push(item);
        }
        assertthat_1.assert.that(resultViewItems).is.equalTo([domainEvents[0]]);
    });
    test('streams the result items and omits unauthorized items.', async () => {
        const queryHandlerIdentifier = {
            view: { name: 'sampleView' },
            name: 'streamAuthorized'
        };
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
        const queryResultStream = await executeStreamQueryHandler_1.executeStreamQueryHandler({
            application,
            queryHandlerIdentifier,
            services: { client: {
                    ...clientService,
                    user: {
                        ...clientService.user,
                        id: 'not.jane.doe'
                    }
                } },
            options: {}
        });
        const resultViewItems = [];
        for await (const item of queryResultStream) {
            resultViewItems.push(item);
        }
        assertthat_1.assert.that(resultViewItems).is.equalTo([]);
    });
    test('streams the result items and respects the given options.', async () => {
        const queryHandlerIdentifier = {
            view: { name: 'sampleView' },
            name: 'streamWithOptions'
        };
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
        const queryResultStream = await executeStreamQueryHandler_1.executeStreamQueryHandler({
            application,
            queryHandlerIdentifier,
            services: { client: clientService },
            options: { filter: { domainEventName: 'executed' } }
        });
        const resultViewItems = [];
        for await (const item of queryResultStream) {
            resultViewItems.push(item);
        }
        assertthat_1.assert.that(resultViewItems).is.equalTo([domainEvents[0]]);
    });
});
//# sourceMappingURL=executeStreamQueryHandlerTests.js.map