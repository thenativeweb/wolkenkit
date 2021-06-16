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
exports.getTestsFor = void 0;
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const getShortId_1 = require("../../../shared/getShortId");
const streamtoarray_1 = require("streamtoarray");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ createDomainEventStore, teardownDomainEventStore }) {
    let domainEventStore, suffix;
    suite('getLastDomainEvent', function () {
        this.timeout(20000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
        test('returns undefined for an aggregate without domain events.', async () => {
            const aggregateIdentifier = {
                context: { name: 'sampleContext' },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'foo'
                }
            };
            const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });
            assertthat_1.assert.that(domainEvent).is.undefined();
        });
        test('returns the last domain event for the given aggregate.', async () => {
            const aggregateIdentifier = {
                context: { name: 'sampleContext' },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            const domainEventJoined = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'joined',
                data: { participant: 'Jane Doe' },
                metadata: {
                    revision: 2,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await domainEventStore.storeDomainEvents({
                domainEvents: [domainEventStarted, domainEventJoined]
            });
            const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });
            assertthat_1.assert.that(domainEvent).is.not.undefined();
            assertthat_1.assert.that(domainEvent.name).is.equalTo('joined');
            assertthat_1.assert.that(domainEvent.metadata.revision).is.equalTo(2);
        });
        test('correctly handles null, undefined and empty arrays.', async () => {
            const aggregateIdentifier = {
                context: { name: 'sampleContext' },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventJoined = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'joined',
                data: {
                    initiator: null,
                    destination: undefined,
                    participants: []
                },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await domainEventStore.storeDomainEvents({ domainEvents: [domainEventJoined] });
            const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });
            assertthat_1.assert.that(domainEvent).is.not.undefined();
            assertthat_1.assert.that(domainEvent.data.initiator).is.null();
            assertthat_1.assert.that(domainEvent.data.participants).is.equalTo([]);
        });
        test('supports tags.', async () => {
            const aggregateIdentifier = {
                context: { name: 'sampleContext' },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    tags: ['gdpr']
                }
            });
            await domainEventStore.storeDomainEvents({
                domainEvents: [domainEventStarted]
            });
            const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });
            assertthat_1.assert.that(domainEvent.metadata.tags).is.equalTo(['gdpr']);
        });
    });
    suite('getDomainEventsByCausationId', function () {
        this.timeout(20000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
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
            const domainEventsByCausationId = await streamtoarray_1.toArray(await domainEventStore.getDomainEventsByCausationId({ causationId: uuid_1.v4() }));
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
            const domainEventsByCausationId = await streamtoarray_1.toArray(await domainEventStore.getDomainEventsByCausationId({ causationId }));
            assertthat_1.assert.that(domainEventsByCausationId.length).is.equalTo(2);
            assertthat_1.assert.that(domainEventsByCausationId.find((domainEvent) => domainEvent.id === domainEvent1.id)).is.not.undefined();
            assertthat_1.assert.that(domainEventsByCausationId.find((domainEvent) => domainEvent.id === domainEvent2.id)).is.not.undefined();
            assertthat_1.assert.that(domainEventsByCausationId.find((domainEvent) => domainEvent.id === domainEvent3.id)).is.undefined();
        });
    });
    suite('hasDomainEventsWithCausationId', function () {
        this.timeout(20000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
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
            const hasDomainEventsWithCausationId = await domainEventStore.hasDomainEventsWithCausationId({ causationId: uuid_1.v4() });
            assertthat_1.assert.that(hasDomainEventsWithCausationId).is.equalTo(false);
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
            const hasDomainEventsWithCausationId = await domainEventStore.hasDomainEventsWithCausationId({ causationId });
            assertthat_1.assert.that(hasDomainEventsWithCausationId).is.equalTo(true);
        });
    });
    suite('getDomainEventsByCorrelationId', function () {
        this.timeout(20000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
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
            const domainEventsByCorrelationId = await streamtoarray_1.toArray(await domainEventStore.getDomainEventsByCorrelationId({ correlationId: uuid_1.v4() }));
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
            const domainEventsByCorrelationId = await streamtoarray_1.toArray(await domainEventStore.getDomainEventsByCorrelationId({ correlationId }));
            assertthat_1.assert.that(domainEventsByCorrelationId.length).is.equalTo(2);
            assertthat_1.assert.that(domainEventsByCorrelationId.find((domainEvent) => domainEvent.id === domainEvent1.id)).is.not.undefined();
            assertthat_1.assert.that(domainEventsByCorrelationId.find((domainEvent) => domainEvent.id === domainEvent2.id)).is.not.undefined();
            assertthat_1.assert.that(domainEventsByCorrelationId.find((domainEvent) => domainEvent.id === domainEvent3.id)).is.undefined();
        });
    });
    suite('getReplayForAggregate', function () {
        this.timeout(5000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
        test('returns an empty stream for a non-existent aggregate.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: uuid_1.v4()
                }
            };
            const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });
            const aggregateDomainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(aggregateDomainEvents.length).is.equalTo(0);
        });
        test('returns a stream of domain events for the given aggregate.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            const domainEventJoined = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'joined',
                data: { participant: 'Jane Doe' },
                metadata: {
                    revision: 2,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await domainEventStore.storeDomainEvents({
                domainEvents: [domainEventStarted, domainEventJoined]
            });
            const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });
            const aggregateDomainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(aggregateDomainEvents.length).is.equalTo(2);
            assertthat_1.assert.that(aggregateDomainEvents[0].name).is.equalTo('started');
            assertthat_1.assert.that(aggregateDomainEvents[1].name).is.equalTo('joined');
        });
        test('returns a stream from revision.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            const domainEventJoined = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'joined',
                data: { participant: 'Jane Doe' },
                metadata: {
                    revision: 2,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await domainEventStore.storeDomainEvents({
                domainEvents: [domainEventStarted, domainEventJoined]
            });
            const domainEventStream = await domainEventStore.getReplayForAggregate({
                aggregateId: aggregateIdentifier.aggregate.id,
                fromRevision: 2
            });
            const aggregateDomainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(aggregateDomainEvents.length).is.equalTo(1);
            assertthat_1.assert.that(aggregateDomainEvents[0].name).is.equalTo('joined');
        });
        test('returns a stream to revision.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            const domainEventJoined = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'joined',
                data: { participant: 'Jane Doe' },
                metadata: {
                    revision: 2,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await domainEventStore.storeDomainEvents({
                domainEvents: [domainEventStarted, domainEventJoined]
            });
            const domainEventStream = await domainEventStore.getReplayForAggregate({
                aggregateId: aggregateIdentifier.aggregate.id,
                toRevision: 1
            });
            const aggregateDomainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(aggregateDomainEvents.length).is.equalTo(1);
            assertthat_1.assert.that(aggregateDomainEvents[0].name).is.equalTo('started');
        });
        test('supports tags.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    tags: ['gdpr']
                }
            });
            await domainEventStore.storeDomainEvents({
                domainEvents: [domainEventStarted]
            });
            const domainEventStream = await domainEventStore.getReplayForAggregate({
                aggregateId: aggregateIdentifier.aggregate.id
            });
            const aggregateDomainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(aggregateDomainEvents[0].metadata.tags).is.equalTo(['gdpr']);
        });
        test('throws an error if the parameter fromRevision is less than 1.', async () => {
            await assertthat_1.assert.that(async () => await domainEventStore.getReplayForAggregate({ aggregateId: uuid_1.v4(), fromRevision: 0 })).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === `Parameter 'fromRevision' must be at least 1.`);
        });
        test('throws an error if the parameter toRevision is less than 1.', async () => {
            await assertthat_1.assert.that(async () => await domainEventStore.getReplayForAggregate({ aggregateId: uuid_1.v4(), toRevision: 0 })).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === `Parameter 'toRevision' must be at least 1.`);
        });
        test(`throws an error if the parameter 'fromRevision' is greater than 'toRevision'.`, async () => {
            await assertthat_1.assert.that(async () => await domainEventStore.getReplayForAggregate({ aggregateId: uuid_1.v4(), fromRevision: 5, toRevision: 3 })).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === `Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
        });
    });
    suite('storeDomainEvents', function () {
        this.timeout(5000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
        test('throws an error if domain events is an empty array.', async () => {
            await assertthat_1.assert.that(async () => {
                await domainEventStore.storeDomainEvents({ domainEvents: [] });
            }).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === 'Domain events are missing.');
        });
        test('stores domain events.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            const domainEventJoined = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'joined',
                data: { participant: 'Jane Doe' },
                metadata: {
                    revision: 2,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await domainEventStore.storeDomainEvents({
                domainEvents: [domainEventStarted, domainEventJoined]
            });
            const domainEventStream = await domainEventStore.getReplayForAggregate({
                aggregateId: aggregateIdentifier.aggregate.id
            });
            const aggregateDomainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(aggregateDomainEvents.length).is.equalTo(2);
            assertthat_1.assert.that(aggregateDomainEvents[0].name).is.equalTo('started');
            assertthat_1.assert.that(aggregateDomainEvents[1].name).is.equalTo('joined');
        });
        test('stores domain events with special characters in keys.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEventStarted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe',
                            claims: {
                                'https://invalid.token/is-anonymous': true,
                                sub: 'jane.doe'
                            } } }
                }
            });
            await assertthat_1.assert.that(async () => {
                await domainEventStore.storeDomainEvents({
                    domainEvents: [domainEventStarted]
                });
            }).is.not.throwingAsync();
        });
        test('throws an error if the aggregate id and revision of the new domain event are already in use.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] });
            await assertthat_1.assert.that(async () => {
                await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] });
            }).is.throwingAsync((ex) => ex.code === errors.RevisionAlreadyExists.code && ex.message === 'Aggregate id and revision already exist.');
        });
        test('correctly handles undefined and null.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: null, destination: undefined },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] });
            const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });
            const aggregateDomainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(aggregateDomainEvents.length).is.equalTo(1);
            assertthat_1.assert.that(aggregateDomainEvents[0].data).is.equalTo({ initiator: null });
        });
        test('supports tags.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier,
                name: 'started',
                data: { initiator: 'Jane Doe', destination: 'Riva' },
                metadata: {
                    revision: 1,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    tags: ['gdpr']
                }
            });
            await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] });
            const domainEventStream = await domainEventStore.getReplayForAggregate({
                aggregateId: aggregateIdentifier.aggregate.id
            });
            const aggregateDomainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(aggregateDomainEvents.length).is.equalTo(1);
            assertthat_1.assert.that(aggregateDomainEvents[0].metadata.tags).is.equalTo(['gdpr']);
        });
    });
    suite('getSnapshot', function () {
        this.timeout(5000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
        test('returns undefined for an aggregate without a snapshot.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
            assertthat_1.assert.that(snapshot).is.undefined();
        });
        test('returns a snapshot for the given aggregate.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const state = {
                initiator: 'Jane Doe',
                destination: 'Riva',
                participants: ['Jane Doe']
            };
            await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state } });
            const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
            assertthat_1.assert.that(snapshot).is.equalTo({
                aggregateIdentifier,
                revision: 5,
                state
            });
        });
        test('correctly handles null, undefined and empty arrays.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const state = {
                initiator: null,
                destination: undefined,
                participants: []
            };
            await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state } });
            const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
            assertthat_1.assert.that(snapshot).is.not.undefined();
            assertthat_1.assert.that(snapshot.aggregateIdentifier).is.equalTo(aggregateIdentifier);
            assertthat_1.assert.that(snapshot.revision).is.equalTo(5);
            assertthat_1.assert.that(snapshot.state).is.equalTo({
                initiator: null,
                participants: []
            });
        });
        test('returns the newest snapshot for the given aggregate.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const stateOld = {
                initiator: 'Jane Doe',
                destination: 'Riva',
                participants: ['Jane Doe']
            };
            const stateNew = {
                initiator: 'Jane Doe',
                destination: 'Moulou',
                participants: ['Jane Doe', 'Jenny Doe']
            };
            await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 5, state: stateOld } });
            await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state: stateNew } });
            const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
            assertthat_1.assert.that(snapshot).is.equalTo({
                aggregateIdentifier,
                revision: 10,
                state: stateNew
            });
        });
    });
    suite('storeSnapshot', function () {
        this.timeout(5000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
        test('stores a snapshot.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const state = {
                initiator: 'Jane Doe',
                destination: 'Riva',
                participants: ['Jane Doe']
            };
            await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state } });
            const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
            assertthat_1.assert.that(snapshot).is.equalTo({
                aggregateIdentifier,
                revision: 10,
                state
            });
        });
        test('stores multiple snapshots.', async () => {
            const state = {
                initiator: 'Jane Doe',
                destination: 'Riva',
                participants: ['Jane Doe']
            };
            const aggregateIdentifiers = [
                {
                    context: { name: 'sampleContext' },
                    aggregate: {
                        id: uuid_1.v4(),
                        name: 'foo'
                    }
                },
                {
                    context: { name: 'sampleContext' },
                    aggregate: {
                        id: uuid_1.v4(),
                        name: 'bar'
                    }
                },
                {
                    context: { name: 'sampleContext' },
                    aggregate: {
                        id: uuid_1.v4(),
                        name: 'baz'
                    }
                }
            ];
            for (const aggregateIdentifier of aggregateIdentifiers) {
                await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state } });
            }
            for (const aggregateIdentifier of aggregateIdentifiers) {
                const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
                assertthat_1.assert.that(snapshot).is.equalTo({
                    aggregateIdentifier,
                    revision: 10,
                    state
                });
            }
        });
        test('correctly handles null, undefined and empty arrays.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const state = {
                initiator: null,
                destination: undefined,
                participants: []
            };
            await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state } });
            const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
            assertthat_1.assert.that(snapshot).is.equalTo({
                aggregateIdentifier,
                revision: 10,
                state: {
                    initiator: null,
                    participants: []
                }
            });
        });
        test('does not throw an error if trying to store an already stored snapshot.', async () => {
            const aggregateIdentifier = {
                context: {
                    name: 'planning'
                },
                aggregate: {
                    id: uuid_1.v4(),
                    name: 'peerGroup'
                }
            };
            const state = {
                initiator: 'Jane Doe',
                destination: 'Riva',
                participants: ['Jane Doe']
            };
            await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state } });
            await domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state } });
        });
    });
    suite('getReplay', function () {
        this.timeout(5000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
        test('returns an empty stream.', async () => {
            const replayStream = await domainEventStore.getReplay({});
            const replayEvents = await streamtoarray_1.toArray(replayStream);
            assertthat_1.assert.that(replayEvents.length).is.equalTo(0);
        });
        suite('with existent data', () => {
            setup(async () => {
                const aggregateIdentifier = {
                    context: {
                        name: 'planning'
                    },
                    aggregate: {
                        id: uuid_1.v4(),
                        name: 'peerGroup'
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
                const domainEventJoinedSecond = buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'joined',
                    data: { participant: 'Jennifer Doe' },
                    metadata: {
                        revision: 3,
                        timestamp: 3,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        tags: ['gdpr']
                    }
                });
                await domainEventStore.storeDomainEvents({
                    domainEvents: [domainEventStarted, domainEventJoinedFirst, domainEventJoinedSecond]
                });
            });
            test('returns all domain events if no options are given.', async () => {
                const replayStream = await domainEventStore.getReplay({});
                const replayEvents = await streamtoarray_1.toArray(replayStream);
                assertthat_1.assert.that(replayEvents.length).is.equalTo(3);
                assertthat_1.assert.that(replayEvents[0].name).is.equalTo('started');
                assertthat_1.assert.that(replayEvents[0].metadata.revision).is.equalTo(1);
                assertthat_1.assert.that(replayEvents[1].name).is.equalTo('joined');
                assertthat_1.assert.that(replayEvents[1].metadata.revision).is.equalTo(2);
                assertthat_1.assert.that(replayEvents[2].name).is.equalTo('joined');
                assertthat_1.assert.that(replayEvents[2].metadata.revision).is.equalTo(3);
            });
            test('returns all domain events from the given timestamp.', async () => {
                const replayStream = await domainEventStore.getReplay({ fromTimestamp: 2 });
                const replayEvents = await streamtoarray_1.toArray(replayStream);
                assertthat_1.assert.that(replayEvents.length).is.equalTo(2);
                assertthat_1.assert.that(replayEvents[0].name).is.equalTo('joined');
                assertthat_1.assert.that(replayEvents[0].metadata.revision).is.equalTo(2);
                assertthat_1.assert.that(replayEvents[1].name).is.equalTo('joined');
                assertthat_1.assert.that(replayEvents[1].metadata.revision).is.equalTo(3);
            });
            test('supports tags.', async () => {
                const replayStream = await domainEventStore.getReplay({});
                const replayEvents = await streamtoarray_1.toArray(replayStream);
                assertthat_1.assert.that(replayEvents[0].metadata.tags).is.equalTo(['gdpr']);
                assertthat_1.assert.that(replayEvents[1].metadata.tags).is.equalTo(['gdpr']);
                assertthat_1.assert.that(replayEvents[2].metadata.tags).is.equalTo(['gdpr']);
            });
        });
        test('throws an error if the parameter fromTimestamp is less than 0.', async () => {
            await assertthat_1.assert.that(async () => await domainEventStore.getReplay({ fromTimestamp: -1 })).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code && ex.message === `Parameter 'fromTimestamp' must be at least 0.`);
        });
    });
    suite('getAggregateIdentifiers', function () {
        this.timeout(5000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
        test('returns an empty stream.', async () => {
            const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiers();
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
                context: { name: 'planning' },
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
            const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiers();
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
                    id: uuid_1.v4(),
                    name: 'peerGroup'
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
            const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiers();
            const aggregateIdentifiers = await streamtoarray_1.toArray(aggregateIdentifierStream);
            assertthat_1.assert.that(aggregateIdentifiers.length).is.equalTo(1);
            assertthat_1.assert.that(aggregateIdentifiers).is.equalTo([aggregateIdentifier]);
        });
    });
    suite('getAggregateIdentifiersByName', function () {
        this.timeout(5000);
        setup(async () => {
            suffix = getShortId_1.getShortId();
            domainEventStore = await createDomainEventStore({ suffix });
            await domainEventStore.setup();
        });
        teardown(async () => {
            await domainEventStore.destroy();
            if (teardownDomainEventStore) {
                await teardownDomainEventStore({ suffix });
            }
        });
        test('returns an empty stream.', async () => {
            const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiersByName({
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
                context: { name: 'planning' },
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
            const aggregateIdentifierThree = {
                context: { name: 'planning' },
                aggregate: {
                    name: 'somethingElse',
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
            const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiersByName({
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
                    id: uuid_1.v4(),
                    name: 'peerGroup'
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
            const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiersByName({
                contextName: 'planning',
                aggregateName: 'peerGroup'
            });
            const aggregateIdentifiers = await streamtoarray_1.toArray(aggregateIdentifierStream);
            assertthat_1.assert.that(aggregateIdentifiers.length).is.equalTo(1);
            assertthat_1.assert.that(aggregateIdentifiers).is.equalTo([aggregateIdentifier]);
        });
    });
};
exports.getTestsFor = getTestsFor;
//# sourceMappingURL=getTestsFor.js.map