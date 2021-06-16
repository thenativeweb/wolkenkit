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
const http_1 = require("../../../../lib/apis/queryDomainEventStore/http");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('queryDomainEventStore/http', () => {
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
        suite('GET /replay', () => {
            test('returns a stream that sends a heartbeat and then ends instantly if there are no domain events to deliver.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/replay',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise((resolve, reject) => {
                    data.on('data', (stuff) => {
                        try {
                            assertthat_1.assert.that(JSON.parse(stuff.toString())).is.equalTo({ name: 'heartbeat' });
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    });
                    data.on('error', reject);
                    data.on('end', resolve);
                });
            });
            test('returns a stream that sends a heartbeat and then all domain events.', async () => {
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
                await domainEventStore.storeDomainEvents({ domainEvents: [firstDomainEvent, secondDomainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/replay',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise((resolve, reject) => {
                    let counter = 0;
                    data.on('error', reject);
                    data.on('end', () => {
                        if (counter === 3) {
                            resolve();
                        }
                        else {
                            reject(new Error('Not all expected messages were received.'));
                        }
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (heartbeat) => {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            counter += 1;
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(firstDomainEvent);
                            counter += 1;
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(secondDomainEvent);
                            counter += 1;
                        }
                    ]));
                });
            });
            test('returns a stream that sends a heartbeat and then all domain events that match the given timestamp constraint.', async () => {
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
                        timestamp: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const secondDomainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        revision: 2,
                        timestamp: 2,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const thirdDomainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        revision: 3,
                        timestamp: 3,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [firstDomainEvent, secondDomainEvent, thirdDomainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/replay?fromTimestamp=3',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise((resolve, reject) => {
                    let counter = 0;
                    data.on('error', reject);
                    data.on('end', () => {
                        if (counter === 2) {
                            resolve();
                        }
                        else {
                            reject(new Error('Not all expected messages were received.'));
                        }
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (heartbeat) => {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            counter += 1;
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(thirdDomainEvent);
                            counter += 1;
                        }
                    ]));
                });
            });
            test('returns 400 if the parameter fromTimestamp is less than 0.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/replay?fromTimestamp=-1',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: `Value -1 is less than minimum 0 (at requestQuery.fromTimestamp).`
                });
            });
            test('returns 400 if the parameter fromTimestamp is not a number.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/replay?fromTimestamp=foo',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: `Invalid type: string should be number (at requestQuery.fromTimestamp).`
                });
            });
        });
        suite('GET /replay/:aggregateId', () => {
            test('returns a stream that sends a heartbeat and then ends instantly if there are no domain events for the selected aggregate to deliver.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const differentAggregateIdentifier = {
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
                await domainEventStore.storeDomainEvents({ domainEvents: [firstDomainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: `/v2/replay/${differentAggregateIdentifier.aggregate.id}`,
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise((resolve, reject) => {
                    data.on('data', (stuff) => {
                        try {
                            assertthat_1.assert.that(JSON.parse(stuff.toString())).is.equalTo({ name: 'heartbeat' });
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    });
                    data.on('error', reject);
                    data.on('end', resolve);
                });
            });
            test('returns a stream that sends a heartbeat and then all domain events.', async () => {
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
                await domainEventStore.storeDomainEvents({ domainEvents: [firstDomainEvent, secondDomainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: `/v2/replay/${aggregateIdentifier.aggregate.id}`,
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise((resolve, reject) => {
                    let counter = 0;
                    data.on('error', reject);
                    data.on('end', () => {
                        if (counter === 3) {
                            resolve();
                        }
                        else {
                            reject(new Error('Not all expected messages were received.'));
                        }
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (heartbeat) => {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            counter += 1;
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(firstDomainEvent);
                            counter += 1;
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(secondDomainEvent);
                            counter += 1;
                        }
                    ]));
                });
            });
            test('returns a stream that sends a heartbeat and then all domain events that match the given revision constraints.', async () => {
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
                const thirdDomainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        revision: 3,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [firstDomainEvent, secondDomainEvent, thirdDomainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: `/v2/replay/${aggregateIdentifier.aggregate.id}?fromRevision=2&toRevision=2`,
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise((resolve, reject) => {
                    let counter = 0;
                    data.on('error', reject);
                    data.on('end', () => {
                        if (counter === 2) {
                            resolve();
                        }
                        else {
                            reject(new Error('Not all expected messages were received.'));
                        }
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (heartbeat) => {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            counter += 1;
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(secondDomainEvent);
                            counter += 1;
                        }
                    ]));
                });
            });
            test('closes the stream once the given to-revision-global is reached and does not deliver it.', async () => {
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
                await domainEventStore.storeDomainEvents({ domainEvents: [firstDomainEvent, secondDomainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: `/v2/replay/${aggregateIdentifier.aggregate.id}?toRevision=1`,
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise(async (resolve, reject) => {
                    let counter = 0;
                    data.on('error', reject);
                    data.on('end', () => {
                        if (counter === 2) {
                            resolve();
                        }
                        else {
                            reject(new Error('Did not receive the expected amount of messages.'));
                        }
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (heartbeat) => {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            counter += 1;
                        },
                        () => {
                            counter += 1;
                        },
                        () => {
                            reject(new Error('Should not have received more than one event.'));
                        }
                    ]));
                });
            });
            test('returns 400 if the parameter fromRevision is less than 1.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/replay/${uuid_1.v4()}?fromRevision=0`,
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: `Value 0 is less than minimum 1 (at requestQuery.fromRevision).`
                });
            });
            test('returns 400 if the parameter fromRevision is not a number.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/replay/${uuid_1.v4()}?fromRevision=foo`,
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: `Invalid type: string should be number (at requestQuery.fromRevision).`
                });
            });
            test('returns 400 if the parameter toRevision is less than 1.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/replay/${uuid_1.v4()}?toRevision=0`,
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: `Value 0 is less than minimum 1 (at requestQuery.toRevision).`
                });
            });
            test('returns 400 if the parameter toRevision is not a number.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/replay/${uuid_1.v4()}?toRevision=foo`,
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: `Invalid type: string should be number (at requestQuery.toRevision).`
                });
            });
            test(`returns 400 if the parameter 'fromRevision' is greater than 'toRevision'.`, async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/replay/${uuid_1.v4()}?fromRevision=4&toRevision=2`,
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: `Query parameter 'toRevision' must be greater or equal to 'fromRevision'.`
                });
            });
        });
        suite('GET /last-domain-event', () => {
            test('retrieves the last domain event for a given aggregate identifier.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const domainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo(domainEvent);
            });
            test('retrieves the latest domain event if multiple were stored.', async () => {
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
                await domainEventStore.storeDomainEvents({ domainEvents: [firstDomainEvent, secondDomainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo(secondDomainEvent);
            });
            test('returns 400 if the aggregate identifier is malformed.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/last-domain-event?aggregateIdentifier={}',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.AggregateIdentifierMalformed.code,
                    message: 'Missing required property: context (at requestQuery.aggregateIdentifier.context).'
                });
            });
            test('returns 404 if no domain events exist for the given aggregate identifier.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: `/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(404);
            });
        });
        suite('GET /domain-events-by-causation-id', () => {
            test('stream ends immediately if no events with a matching causation id exist.', async () => {
                const domainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: `/v2/domain-events-by-causation-id?causation-id=${uuid_1.v4()}`,
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise((resolve, reject) => {
                    data.on('data', (stuff) => {
                        try {
                            assertthat_1.assert.that(JSON.parse(stuff.toString())).is.equalTo({ name: 'heartbeat' });
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    });
                    data.on('error', reject);
                    data.on('end', resolve);
                });
            });
            test('returns all domain events with a matching causation id.', async () => {
                const causationId = uuid_1.v4();
                const domainEvent1 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId,
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const domainEvent2 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId,
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const domainEvent3 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent1, domainEvent2, domainEvent3] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: `/v2/domain-events-by-causation-id?causation-id=${causationId}`,
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                const collector = wait_for_signals_1.waitForSignals({ count: 4 });
                data.on('error', async (ex) => {
                    await collector.fail(ex);
                });
                data.on('end', async () => {
                    await collector.signal();
                });
                data.pipe(asJsonStream_1.asJsonStream([
                    async (heartbeat) => {
                        try {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            await collector.signal();
                        }
                        catch (ex) {
                            await collector.fail(ex);
                        }
                    },
                    async (domainEvent) => {
                        try {
                            assertthat_1.assert.that(domainEvent).is.atLeast({ id: domainEvent1.id });
                            await collector.signal();
                        }
                        catch (ex) {
                            await collector.fail(ex);
                        }
                    },
                    async (domainEvent) => {
                        try {
                            assertthat_1.assert.that(domainEvent).is.atLeast({ id: domainEvent2.id });
                            await collector.signal();
                        }
                        catch (ex) {
                            await collector.fail(ex);
                        }
                    }
                ]));
                await collector.promise;
            });
        });
        suite('GET /has-domain-events-with-causation-id', () => {
            test('returns false if no events with a matching causation id exist.', async () => {
                const domainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/has-domain-events-with-causation-id?causation-id=${uuid_1.v4()}`
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo({ hasDomainEventsWithCausationId: false });
            });
            test('returns true if events with a matching causation id exist.', async () => {
                const causationId = uuid_1.v4();
                const domainEvent1 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId,
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const domainEvent2 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId,
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const domainEvent3 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent1, domainEvent2, domainEvent3] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/has-domain-events-with-causation-id?causation-id=${causationId}`
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo({ hasDomainEventsWithCausationId: true });
            });
        });
        suite('GET /domain-events-by-correlation-id', () => {
            test('returns an empty array if no events with a matching correlation id exist.', async () => {
                const domainEvent = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: `/v2/domain-events-by-correlation-id?correlation-id=${uuid_1.v4()}`,
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                await new Promise((resolve, reject) => {
                    data.on('data', (stuff) => {
                        try {
                            assertthat_1.assert.that(JSON.parse(stuff.toString())).is.equalTo({ name: 'heartbeat' });
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    });
                    data.on('error', reject);
                    data.on('end', resolve);
                });
            });
            test('returns all domain events with a matching correlation id.', async () => {
                const correlationId = uuid_1.v4();
                const domainEvent1 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId,
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const domainEvent2 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId,
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                const domainEvent3 = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_1.v4()
                        }
                    },
                    name: 'execute',
                    data: {},
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        revision: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent1, domainEvent2, domainEvent3] });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: `/v2/domain-events-by-correlation-id?correlation-id=${correlationId}`,
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                const collector = wait_for_signals_1.waitForSignals({ count: 4 });
                data.on('error', async (ex) => {
                    await collector.fail(ex);
                });
                data.on('end', async () => {
                    await collector.signal();
                });
                data.pipe(asJsonStream_1.asJsonStream([
                    async (heartbeat) => {
                        try {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            await collector.signal();
                        }
                        catch (ex) {
                            await collector.fail(ex);
                        }
                    },
                    async (domainEvent) => {
                        try {
                            assertthat_1.assert.that(domainEvent).is.atLeast({ id: domainEvent1.id });
                            await collector.signal();
                        }
                        catch (ex) {
                            await collector.fail(ex);
                        }
                    },
                    async (domainEvent) => {
                        try {
                            assertthat_1.assert.that(domainEvent).is.atLeast({ id: domainEvent2.id });
                            await collector.signal();
                        }
                        catch (ex) {
                            await collector.fail(ex);
                        }
                    }
                ]));
                await collector.promise;
            });
        });
        suite('GET /snapshot', () => {
            test('retrieves the snapshot for a given aggregate identifier.', async () => {
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
                await domainEventStore.storeSnapshot({
                    snapshot
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo(snapshot);
            });
            test('retrieves the latest snapshot if multiple were stored.', async () => {
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
                await domainEventStore.storeSnapshot({
                    snapshot: firstSnapshot
                });
                await domainEventStore.storeSnapshot({
                    snapshot: secondSnapshot
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: `/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data).is.equalTo(secondSnapshot);
            });
            test('returns 400 if the aggregate identifier is malformed.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/snapshot?aggregateIdentifier={}',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'Missing required property: context (at requestQuery.aggregateIdentifier.context).'
                });
            });
            test('returns 404 if no snapshot exists for the given aggregate identifier.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: `/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(404);
            });
        });
        suite('GET /get-aggregate-identifiers', () => {
            test('returns a stream that sends a heartbeat and then ends instantly if there are no aggregate identifiers to deliver.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/get-aggregate-identifiers',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                const counter = wait_for_signals_1.waitForSignals({ count: 1 });
                data.on('data', async (stuff) => {
                    assertthat_1.assert.that(JSON.parse(stuff.toString())).is.equalTo({ name: 'heartbeat' });
                    await counter.signal();
                });
                data.on('error', async () => {
                    await counter.fail();
                });
                await counter.promise;
            });
            test('returns a stream that sends a heartbeat and then all aggregate identifiers of all aggregates that have domain events in the store.', async () => {
                const aggregateIdentifierOne = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventStartedOne = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierOne,
                    name: 'started',
                    data: { initiator: 'Jane Doe', destination: 'Riva' },
                    metadata: {
                        revision: 1,
                        timestamp: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                const aggregateIdentifierTwo = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventStartedTwo = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierTwo,
                    name: 'started',
                    data: { initiator: 'Jane Doe', destination: 'Riva' },
                    metadata: {
                        revision: 1,
                        timestamp: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                await domainEventStore.storeDomainEvents({
                    domainEvents: [domainEventStartedOne, domainEventStartedTwo]
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/get-aggregate-identifiers',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                const counter = wait_for_signals_1.waitForSignals({ count: 3 });
                data.on('error', async () => {
                    await counter.fail();
                });
                data.pipe(asJsonStream_1.asJsonStream([
                    async (heartbeat) => {
                        try {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    },
                    async (aggregateIdentifier) => {
                        try {
                            assertthat_1.assert.that(aggregateIdentifier).is.equalTo(aggregateIdentifierOne);
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    },
                    async (aggregateIdentifier) => {
                        try {
                            assertthat_1.assert.that(aggregateIdentifier).is.equalTo(aggregateIdentifierTwo);
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    }
                ]));
                await counter.promise;
            });
            test('emits each aggregate identifier only once.', async () => {
                const aggregateIdentifierOne = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierOne,
                    name: 'started',
                    data: { initiator: 'Jane Doe', destination: 'Riva' },
                    metadata: {
                        revision: 1,
                        timestamp: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                const domainEventJoinedFirst = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierOne,
                    name: 'joined',
                    data: { participant: 'Jane Doe' },
                    metadata: {
                        revision: 2,
                        timestamp: 2,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                await domainEventStore.storeDomainEvents({
                    domainEvents: [domainEventStarted, domainEventJoinedFirst]
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/get-aggregate-identifiers',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                const counter = wait_for_signals_1.waitForSignals({ count: 2 });
                data.on('error', async () => {
                    await counter.fail();
                });
                data.pipe(asJsonStream_1.asJsonStream([
                    async (heartbeat) => {
                        try {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    },
                    async (aggregateIdentifier) => {
                        try {
                            assertthat_1.assert.that(aggregateIdentifier).is.equalTo(aggregateIdentifier);
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    }
                ]));
                await counter.promise;
            });
        });
        suite('GET /get-aggregate-identifiers-by-name', () => {
            test('returns a stream that sends a heartbeat and then ends instantly if there are no aggregate identifiers to deliver.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/get-aggregate-identifiers-by-name?contextName=planning&aggregateName=peerGroup',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                const counter = wait_for_signals_1.waitForSignals({ count: 1 });
                data.on('data', async (stuff) => {
                    assertthat_1.assert.that(JSON.parse(stuff.toString())).is.equalTo({ name: 'heartbeat' });
                    await counter.signal();
                });
                data.on('error', async () => {
                    await counter.fail();
                });
                await counter.promise;
            });
            test('returns a stream that sends a heartbeat and then streams the aggregate identifiers that belong to the given aggregate name and have domain events in the store.', async () => {
                const aggregateIdentifierOne = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventStartedOne = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierOne,
                    name: 'started',
                    data: { initiator: 'Jane Doe', destination: 'Riva' },
                    metadata: {
                        revision: 1,
                        timestamp: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                const aggregateIdentifierTwo = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventStartedTwo = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierTwo,
                    name: 'started',
                    data: { initiator: 'Jane Doe', destination: 'Riva' },
                    metadata: {
                        revision: 1,
                        timestamp: 2,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                const aggregateIdentifierThree = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventThree = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierThree,
                    name: 'foo',
                    data: {},
                    metadata: {
                        revision: 1,
                        timestamp: 3,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                await domainEventStore.storeDomainEvents({
                    domainEvents: [domainEventStartedOne, domainEventStartedTwo, domainEventThree]
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/get-aggregate-identifiers-by-name?contextName=planning&aggregateName=peerGroup',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                const counter = wait_for_signals_1.waitForSignals({ count: 3 });
                data.on('error', async () => {
                    await counter.fail();
                });
                data.pipe(asJsonStream_1.asJsonStream([
                    async (heartbeat) => {
                        try {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    },
                    async (aggregateIdentifier) => {
                        try {
                            assertthat_1.assert.that(aggregateIdentifier).is.equalTo(aggregateIdentifierOne);
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    },
                    async (aggregateIdentifier) => {
                        try {
                            assertthat_1.assert.that(aggregateIdentifier).is.equalTo(aggregateIdentifierTwo);
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    }
                ]));
                await counter.promise;
            });
            test('emits each aggregate identifier only once.', async () => {
                const aggregateIdentifierOne = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierOne,
                    name: 'started',
                    data: { initiator: 'Jane Doe', destination: 'Riva' },
                    metadata: {
                        revision: 1,
                        timestamp: 1,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                const domainEventJoinedFirst = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateIdentifierOne,
                    name: 'joined',
                    data: { participant: 'Jane Doe' },
                    metadata: {
                        revision: 2,
                        timestamp: 2,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                await domainEventStore.storeDomainEvents({
                    domainEvents: [domainEventStarted, domainEventJoinedFirst]
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data, headers } = await client({
                    method: 'get',
                    url: '/v2/get-aggregate-identifiers-by-name?contextName=planning&aggregateName=peerGroup',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
                const counter = wait_for_signals_1.waitForSignals({ count: 2 });
                data.on('error', async () => {
                    await counter.fail();
                });
                data.pipe(asJsonStream_1.asJsonStream([
                    async (heartbeat) => {
                        try {
                            assertthat_1.assert.that(heartbeat).is.equalTo({ name: 'heartbeat' });
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    },
                    async (aggregateIdentifier) => {
                        try {
                            assertthat_1.assert.that(aggregateIdentifier).is.equalTo(aggregateIdentifier);
                            await counter.signal();
                        }
                        catch (ex) {
                            await counter.fail(ex);
                        }
                    }
                ]));
                await counter.promise;
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map