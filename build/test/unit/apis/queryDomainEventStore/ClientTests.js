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
const Client_1 = require("../../../../lib/apis/queryDomainEventStore/http/v2/Client");
const createDomainEventStore_1 = require("../../../../lib/stores/domainEventStore/createDomainEventStore");
const http_1 = require("../../../../lib/apis/queryDomainEventStore/http");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const streamtoarray_1 = require("streamtoarray");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('queryDomainEventStore/http/Client', () => {
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
        suite('getReplay', () => {
            test('returns a stream that ends instantly if there are no domain events to deliver.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getReplay({});
                await new Promise((resolve, reject) => {
                    data.on('data', () => {
                        reject(new Error('Stream should not have sent data.'));
                    });
                    data.on('error', reject);
                    data.on('end', resolve);
                });
            });
            test('returns a stream that sends all domain events.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getReplay({});
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
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(firstDomainEvent);
                            counter += 1;
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(secondDomainEvent);
                            counter += 1;
                        }
                    ], true));
                });
            });
            test('returns a stream that sends all domain events that match the given timestamp constraint.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getReplay({ fromTimestamp: 2 });
                await new Promise((resolve, reject) => {
                    let counter = 0;
                    data.on('error', reject);
                    data.on('end', () => {
                        if (counter === 1) {
                            resolve();
                        }
                        else {
                            reject(new Error('Not all expected messages were received.'));
                        }
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(secondDomainEvent);
                            counter += 1;
                        }
                    ], true));
                });
            });
            test('throws an error if the parameter fromTimestamp is less than 0.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => await client.getReplay({ fromTimestamp: -1 })).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === `Parameter 'fromTimestamp' must be at least 0.`);
            });
        });
        suite('getReplayForAggregate', () => {
            test('returns a stream that ends instantly if there are no domain events in the selected aggregate to deliver.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getReplayForAggregate({ aggregateId: differentAggregateIdentifier.aggregate.id });
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
            test('returns a stream that sends all domain events in the selected aggregate.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });
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
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(firstDomainEvent);
                            counter += 1;
                        },
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(secondDomainEvent);
                            counter += 1;
                        }
                    ], true));
                });
            });
            test('returns a stream that sends all domain events in the selected aggregate that match the given revision constraints.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id, fromRevision: 2, toRevision: 2 });
                await new Promise((resolve, reject) => {
                    let counter = 0;
                    data.on('error', reject);
                    data.on('end', () => {
                        if (counter === 1) {
                            resolve();
                        }
                        else {
                            reject(new Error('Not all expected messages were received.'));
                        }
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (domainEvent) => {
                            assertthat_1.assert.that(domainEvent).is.equalTo(secondDomainEvent);
                            counter += 1;
                        }
                    ], true));
                });
            });
            test('closes the stream once the given to-revision-global is reached.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id, toRevision: 1 });
                await new Promise(async (resolve, reject) => {
                    let counter = 0;
                    data.on('error', reject);
                    data.on('end', () => {
                        if (counter === 1) {
                            resolve();
                        }
                        else {
                            reject(new Error('Did not receive the expected amount of messages.'));
                        }
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        () => {
                            counter += 1;
                        },
                        () => {
                            reject(new Error('Should not have received more than one event.'));
                        }
                    ], true));
                });
            });
            test('throws an error if the parameter fromRevision is less than 1.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => await client.getReplayForAggregate({ aggregateId: uuid_1.v4(), fromRevision: 0 })).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === `Parameter 'fromRevision' must be at least 1.`);
            });
            test('throws an error if the parameter toRevision is less than 1.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => await client.getReplayForAggregate({ aggregateId: uuid_1.v4(), toRevision: 0 })).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === `Parameter 'toRevision' must be at least 1.`);
            });
            test(`throws an error if the parameter 'fromRevision' is greater than 'toRevision'.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => await client.getReplayForAggregate({ aggregateId: uuid_1.v4(), fromRevision: 5, toRevision: 3 })).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === `Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
            });
        });
        suite('getLastDomainEvent', () => {
            test('retrieves the last domain event for a given aggregate idententifier.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getLastDomainEvent({ aggregateIdentifier });
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getLastDomainEvent({ aggregateIdentifier });
                assertthat_1.assert.that(data).is.equalTo(secondDomainEvent);
            });
            test('returns undefined if no domain event exists for the given aggregate identifier.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getLastDomainEvent({ aggregateIdentifier });
                assertthat_1.assert.that(data).is.undefined();
            });
        });
        suite('getDomainEventsByCausationId', () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const domainEventsByCausationId = await streamtoarray_1.toArray(await client.getDomainEventsByCausationId({ causationId: uuid_1.v4() }));
                assertthat_1.assert.that(domainEventsByCausationId).is.equalTo([]);
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const domainEventsByCausationId = await streamtoarray_1.toArray(await client.getDomainEventsByCausationId({ causationId }));
                assertthat_1.assert.that(domainEventsByCausationId.length).is.equalTo(2);
                assertthat_1.assert.that(domainEventsByCausationId[0].id).is.equalTo(domainEvent1.id);
                assertthat_1.assert.that(domainEventsByCausationId[1].id).is.equalTo(domainEvent2.id);
            });
        });
        suite('hasDomainEventsWithCausationId', () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const domainEventsByCausationId = await client.hasDomainEventsWithCausationId({ causationId: uuid_1.v4() });
                assertthat_1.assert.that(domainEventsByCausationId).is.false();
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const domainEventsByCausationId = await client.hasDomainEventsWithCausationId({ causationId });
                assertthat_1.assert.that(domainEventsByCausationId).is.true();
            });
        });
        suite('getDomainEventsByCorrelationId', () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const domainEventsByCorrelationId = await streamtoarray_1.toArray(await client.getDomainEventsByCorrelationId({ correlationId: uuid_1.v4() }));
                assertthat_1.assert.that(domainEventsByCorrelationId).is.equalTo([]);
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const domainEventsByCorrelationId = await streamtoarray_1.toArray(await client.getDomainEventsByCorrelationId({ correlationId }));
                assertthat_1.assert.that(domainEventsByCorrelationId.length).is.equalTo(2);
                assertthat_1.assert.that(domainEventsByCorrelationId[0].id).is.equalTo(domainEvent1.id);
                assertthat_1.assert.that(domainEventsByCorrelationId[1].id).is.equalTo(domainEvent2.id);
            });
        });
        suite('getSnapshot', () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getSnapshot({ aggregateIdentifier });
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getSnapshot({ aggregateIdentifier });
                assertthat_1.assert.that(data).is.equalTo(secondSnapshot);
            });
            test('returns undefined if no snapshot exists for the given aggregate identifier.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'sampleContext'
                    },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    }
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getSnapshot({ aggregateIdentifier });
                assertthat_1.assert.that(data).is.undefined();
            });
        });
        suite('getAggregateIdentifiers', () => {
            test('returns an empty stream.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const aggregateIdentifierStream = await client.getAggregateIdentifiers();
                const aggregateIdentifiers = await streamtoarray_1.toArray(aggregateIdentifierStream);
                assertthat_1.assert.that(aggregateIdentifiers.length).is.equalTo(0);
            });
            test('streams the aggregate identifiers of all aggregates that have domain events in the store.', async () => {
                const aggregateIdentifierOne = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        id: uuid_1.v4(),
                        name: 'peerGroup'
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
                        id: uuid_1.v4(),
                        name: 'peerGroup'
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
                await domainEventStore.storeDomainEvents({
                    domainEvents: [domainEventStartedOne, domainEventStartedTwo]
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const aggregateIdentifierStream = await client.getAggregateIdentifiers();
                const aggregateIdentifiers = await streamtoarray_1.toArray(aggregateIdentifierStream);
                assertthat_1.assert.that(aggregateIdentifiers.length).is.equalTo(2);
                assertthat_1.assert.that(aggregateIdentifiers).is.equalTo([aggregateIdentifierOne, aggregateIdentifierTwo]);
            });
            test('emits each aggregate identifier only once.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
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
                    aggregateIdentifier,
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const aggregateIdentifierStream = await client.getAggregateIdentifiers();
                const aggregateIdentifiers = await streamtoarray_1.toArray(aggregateIdentifierStream);
                assertthat_1.assert.that(aggregateIdentifiers.length).is.equalTo(1);
                assertthat_1.assert.that(aggregateIdentifiers).is.equalTo([aggregateIdentifier]);
            });
        });
        suite('getAggregateIdentifiersByName', () => {
            test('returns an empty stream.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const aggregateIdentifierStream = await client.getAggregateIdentifiersByName({
                    contextName: 'planning',
                    aggregateName: 'peerGroup'
                });
                const aggregateIdentifiers = await streamtoarray_1.toArray(aggregateIdentifierStream);
                assertthat_1.assert.that(aggregateIdentifiers.length).is.equalTo(0);
            });
            test('streams the aggregate identifiers that belong to the given aggregate name and have domain events in the store.', async () => {
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
                        name: 'notPlanning'
                    },
                    aggregate: {
                        name: 'notPeerGroup',
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const aggregateIdentifierStream = await client.getAggregateIdentifiersByName({
                    contextName: 'planning',
                    aggregateName: 'peerGroup'
                });
                const aggregateIdentifiers = await streamtoarray_1.toArray(aggregateIdentifierStream);
                assertthat_1.assert.that(aggregateIdentifiers.length).is.equalTo(2);
                assertthat_1.assert.that(aggregateIdentifiers).is.equalTo([aggregateIdentifierOne, aggregateIdentifierTwo]);
            });
            test('emits each aggregate identifier only once.', async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        name: 'peerGroup',
                        id: uuid_1.v4()
                    }
                };
                const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
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
                    aggregateIdentifier,
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const aggregateIdentifierStream = await client.getAggregateIdentifiersByName({
                    contextName: 'planning',
                    aggregateName: 'peerGroup'
                });
                const aggregateIdentifiers = await streamtoarray_1.toArray(aggregateIdentifierStream);
                assertthat_1.assert.that(aggregateIdentifiers.length).is.equalTo(1);
                assertthat_1.assert.that(aggregateIdentifiers).is.equalTo([aggregateIdentifier]);
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map