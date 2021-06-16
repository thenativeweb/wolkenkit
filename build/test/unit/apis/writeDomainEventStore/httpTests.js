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
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const createDomainEventStore_1 = require("../../../../lib/stores/domainEventStore/createDomainEventStore");
const http_1 = require("../../../../lib/apis/writeDomainEventStore/http");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('writeDomainEventStore/http', () => {
    suite('/v2', () => {
        let api, domainEventStore;
        setup(async () => {
            domainEventStore = await createDomainEventStore_1.createDomainEventStore({
                type: 'InMemory'
            });
            ({ api } = await http_1.getApi({
                corsOrigin: '*',
                domainEventStore
            }));
        });
        suite('POST /store-domain-events', () => {
            test('stores the given domain events.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const firstDomainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const secondDomainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        revision: 2,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/store-domain-events',
                    data: [firstDomainEvent, secondDomainEvent]
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo({});
                const domainEventReplay = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });
                await new Promise((resolve) => {
                    domainEventReplay.pipe(asJsonStream_1.asJsonStream([
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(firstDomainEvent);
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(secondDomainEvent);
                            resolve();
                        }
                    ], true));
                });
            });
            test('returns 400 if the data is not an array.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/store-domain-events',
                    data: {},
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'Request body must be an array of domain events.'
                });
            });
            test('returns 400 if a domain event is malformed.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/store-domain-events',
                    data: [{}],
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.DomainEventMalformed.code,
                    message: 'Missing required property: aggregateIdentifier (at value.aggregateIdentifier).'
                });
            });
            test('returns 400 if the data is an empty array.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/store-domain-events',
                    data: [],
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ParameterInvalid.code,
                    message: 'Domain events are missing.'
                });
            });
            test('returns 415 if the content type is not application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/store-domain-events',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(415);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ContentTypeMismatch.code,
                    message: 'Header content-type must be application/json.'
                });
            });
        });
        suite('POST /store-snapshot', () => {
            test('stores the given snapshot.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const snapshot = {
                    aggregateIdentifier,
                    revision: 1,
                    state: {}
                };
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/store-snapshot',
                    data: snapshot
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(await domainEventStore.getSnapshot({ aggregateIdentifier })).is.equalTo(snapshot);
            });
            test('overwrites the previous snapshot if one existed.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const firstSnapshot = {
                    aggregateIdentifier,
                    revision: 1,
                    state: {}
                };
                const secondSnapshot = {
                    aggregateIdentifier,
                    revision: 2,
                    state: {}
                };
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/store-snapshot',
                    data: firstSnapshot
                });
                await client({
                    method: 'post',
                    url: '/v2/store-snapshot',
                    data: secondSnapshot
                });
                assertthat_1.assert.that(await domainEventStore.getSnapshot({ aggregateIdentifier })).is.equalTo(secondSnapshot);
            });
            test('returns 400 if the snapshot is malformed.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/store-snapshot',
                    data: {},
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.SnapshotMalformed.code,
                    message: 'Missing required property: aggregateIdentifier (at requestBody.aggregateIdentifier).'
                });
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map