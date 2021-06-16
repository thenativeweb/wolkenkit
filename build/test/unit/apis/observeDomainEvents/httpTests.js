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
const createLockStore_1 = require("../../../../lib/stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const DomainEventWithState_1 = require("../../../../lib/common/elements/DomainEventWithState");
const http_1 = require("../../../../lib/apis/observeDomainEvents/http");
const getApplicationDescription_1 = require("../../../../lib/common/application/getApplicationDescription");
const getSnapshotStrategy_1 = require("../../../../lib/common/domain/getSnapshotStrategy");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const InMemory_1 = require("../../../../lib/stores/domainEventStore/InMemory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const Repository_1 = require("../../../../lib/common/domain/Repository");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const sleep_1 = require("../../../../lib/common/utils/sleep");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('observeDomainEvents/http', () => {
    const identityProviders = [identityProvider_1.identityProvider];
    const heartbeatInterval = 90000;
    let application, domainEventStore, publisher, pubSubChannelForNotifications, repository;
    setup(async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        domainEventStore = await InMemory_1.InMemoryDomainEventStore.create({ type: 'InMemory' });
        publisher = await createPublisher_1.createPublisher({ type: 'InMemory' });
        pubSubChannelForNotifications = 'notifications';
        repository = new Repository_1.Repository({
            application,
            lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
            domainEventStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            publisher,
            pubSubChannelForNotifications
        });
    });
    teardown(async () => {
        await domainEventStore.destroy();
    });
    suite('/v2', () => {
        suite('GET /description', () => {
            let api;
            setup(async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    application,
                    repository,
                    identityProviders,
                    heartbeatInterval
                }));
            });
            test('returns the status code 200.', async () => {
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
            test('returns the domain events description.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/description'
                });
                const { domainEvents: domainEventsDescription } = getApplicationDescription_1.getApplicationDescription({
                    application
                });
                // Convert and parse as JSON, to get rid of any values that are undefined.
                // This is what the HTTP API does internally, and here we need to simulate
                // this to make things work.
                const expectedDomainEventsDescription = JSON.parse(JSON.stringify(domainEventsDescription));
                assertthat_1.assert.that(data).is.equalTo(expectedDomainEventsDescription);
            });
        });
        suite('GET /', () => {
            let api, publishDomainEvent;
            setup(async () => {
                ({ api, publishDomainEvent } = await http_1.getApi({
                    corsOrigin: '*',
                    application,
                    repository,
                    identityProviders,
                    heartbeatInterval
                }));
            });
            test('returns 400 if the query is malformed.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: '/v2/?foo=bar',
                    responseType: 'stream',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
            });
            test('returns 200 and delivers a single domain event.', async () => {
                const executed = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: {
                            revision: 1,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ]));
                });
            });
            test('returns 200 and delivers multiple domain events.', async () => {
                const succeeded = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'succeeded',
                        data: {},
                        metadata: {
                            revision: 1,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                const executed = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: {
                            revision: 2,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: succeeded });
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('succeeded');
                            assertthat_1.assert.that(streamElement.data).is.equalTo({});
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                            assertthat_1.assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ]));
                });
            });
            test('returns 200 and delivers filtered domain events.', async () => {
                const succeeded = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'succeeded',
                        data: {},
                        metadata: {
                            revision: 1,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                const executed = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: {
                            revision: 2,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: succeeded });
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/',
                    params: { filter: { name: 'executed' } },
                    paramsSerializer(params) {
                        return Object.entries(params).
                            map(([key, value]) => `${key}=${JSON.stringify(value)}`).
                            join('&');
                    },
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                            assertthat_1.assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ]));
                });
            });
            test('returns 200 and delivers filtered domain events with a nested filter.', async () => {
                const succeeded = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'succeeded',
                        data: {},
                        metadata: {
                            revision: 1,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                const executed = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: {
                            revision: 2,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: succeeded });
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/',
                    params: { filter: {
                            aggregateIdentifier: { context: { name: 'sampleContext' } },
                            name: 'executed'
                        } },
                    paramsSerializer(params) {
                        return Object.entries(params).
                            map(([key, value]) => `${key}=${JSON.stringify(value)}`).
                            join('&');
                    },
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                            assertthat_1.assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ]));
                });
            });
            test('returns 200 and delivers rejected/failed events to their initiator.', async () => {
                const failed = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'authenticateFailed',
                        data: { reason: 'test' },
                        metadata: {
                            revision: 1,
                            initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                const rejected = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'authenticateRejected',
                        data: { reason: 'test' },
                        metadata: {
                            revision: 2,
                            initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: failed });
                    publishDomainEvent({ domainEvent: rejected });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/',
                    headers: {
                        'x-anonymous-id': 'jane.doe'
                    },
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const collector = wait_for_signals_1.waitForSignals({ count: 2 });
                data.on('error', async (err) => {
                    await collector.fail(err);
                });
                data.on('close', async () => {
                    await collector.fail();
                });
                data.pipe(asJsonStream_1.asJsonStream([
                    (streamElement) => {
                        assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                    },
                    async (streamElement) => {
                        try {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('authenticateFailed');
                            await collector.signal();
                        }
                        catch (ex) {
                            await collector.fail(ex);
                        }
                    },
                    async (streamElement) => {
                        try {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('authenticateRejected');
                            await collector.signal();
                        }
                        catch (ex) {
                            await collector.fail(ex);
                        }
                    }
                ]));
                await collector.promise;
            });
            test('returns 200 and does not deliver rejected/failed events to other clients than the initiator.', async () => {
                const failed = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'authenticateFailed',
                        data: { reason: 'test' },
                        metadata: {
                            revision: 1,
                            initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                const rejected = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'authenticateRejected',
                        data: { reason: 'test' },
                        metadata: {
                            revision: 2,
                            initiator: { user: { id: 'anonymous-jane.doe', claims: { sub: 'anonymous-jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: failed });
                    publishDomainEvent({ domainEvent: rejected });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'get',
                    url: '/v2/',
                    headers: {
                        'x-anonymous-id': 'john.doe'
                    },
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const collector = wait_for_signals_1.waitForSignals({ count: 1 });
                data.on('error', async (err) => {
                    await collector.fail(err);
                });
                data.on('close', async () => {
                    await collector.fail();
                });
                data.pipe(asJsonStream_1.asJsonStream([
                    (streamElement) => {
                        assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                    },
                    async () => {
                        await collector.fail();
                    }
                ]));
                setTimeout(async () => {
                    await collector.signal();
                }, 200);
                await collector.promise;
            });
            test('can not publish invalid events.', async () => {
                const invalid = { foo: 'bar' };
                await assertthat_1.assert.that(async () => {
                    publishDomainEvent({ domainEvent: invalid });
                }).is.throwingAsync((ex) => ex.code === errors.DomainEventMalformed.code);
            });
            test('removes state before delivery.', async () => {
                const executed = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: {
                            revision: 1,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.state).is.undefined();
                            resolve();
                        }
                    ]));
                });
            });
            test('gracefully handles connections that get closed by the client.', async () => {
                const executed = new DomainEventWithState_1.DomainEventWithState({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        metadata: {
                            revision: 1,
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                        }
                    }),
                    state: { previous: {}, next: {} }
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                try {
                    await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream',
                        timeout: 100
                    });
                }
                catch (ex) {
                    if (ex.code !== 'ECONNABORTED') {
                        throw ex;
                    }
                    // Ignore aborted connections, since that's what we want to achieve
                    // here.
                }
                await sleep_1.sleep({ ms: 50 });
                await assertthat_1.assert.that(async () => {
                    publishDomainEvent({ domainEvent: executed });
                }).is.not.throwingAsync();
            });
            suite('isAuthorized', () => {
                test('skips a domain event if the domain event is not authorized.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({
                        name: 'withDomainEventAuthorization'
                    });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const authorizationDenied = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'authorizationDenied',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    const executed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'executed',
                            data: { strategy: 'succeed' },
                            metadata: {
                                revision: 2,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: authorizationDenied });
                        publishDomainEvent({ domainEvent: executed });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                                resolve();
                            }
                        ]));
                    });
                });
                test('skips a domain event if an error is thrown.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({
                        name: 'withDomainEventAuthorization'
                    });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const authorizationFailed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'authorizationFailed',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    const executed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'executed',
                            data: { strategy: 'succeed' },
                            metadata: {
                                revision: 2,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: authorizationFailed });
                        publishDomainEvent({ domainEvent: executed });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                                resolve();
                            }
                        ]));
                    });
                });
                test('does not mutate the domain event.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventAuthorization' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const authorizationWithMutation = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'authorizationWithMutation',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: authorizationWithMutation });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('authorizationWithMutation');
                                resolve();
                            }
                        ]));
                    });
                    assertthat_1.assert.that(authorizationWithMutation.data.isMutated).is.undefined();
                });
            });
            suite('filter', () => {
                test('does not skip a domain event if the domain event does not get filtered out.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventFilter' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const filterPassed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'filterPassed',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: filterPassed });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('filterPassed');
                                resolve();
                            }
                        ]));
                    });
                });
                test('skips a domain event if the domain event gets filtered out.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventFilter' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const filterDenied = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'filterDenied',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    const executed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'executed',
                            data: { strategy: 'succeed' },
                            metadata: {
                                revision: 2,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: filterDenied });
                        publishDomainEvent({ domainEvent: executed });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                                resolve();
                            }
                        ]));
                    });
                });
                test('skips a domain event if an error is thrown.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventFilter' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const filterFailed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'filterFailed',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    const executed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'executed',
                            data: { strategy: 'succeed' },
                            metadata: {
                                revision: 2,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: filterFailed });
                        publishDomainEvent({ domainEvent: executed });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                                resolve();
                            }
                        ]));
                    });
                });
                test('does not mutate the domain event.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventFilter' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const filterWithMutation = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'filterWithMutation',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: filterWithMutation });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('filterWithMutation');
                                resolve();
                            }
                        ]));
                    });
                    assertthat_1.assert.that(filterWithMutation.data.isMutated).is.undefined();
                });
            });
            suite('map', () => {
                test('maps the domain event.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventMap' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const mapApplied = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'mapApplied',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: mapApplied });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('mapApplied');
                                assertthat_1.assert.that(streamElement.data).is.equalTo({ isMapped: true });
                                resolve();
                            }
                        ]));
                    });
                });
                test('skips a domain event if the domain event gets mapped to undefined.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventMap' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const mapToUndefined = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'mapToUndefined',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    const executed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'executed',
                            data: { strategy: 'succeed' },
                            metadata: {
                                revision: 2,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: mapToUndefined });
                        publishDomainEvent({ domainEvent: executed });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                                resolve();
                            }
                        ]));
                    });
                });
                test('skips a domain event if an error is thrown.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventMap' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const mapFailed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'mapFailed',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    const executed = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'executed',
                            data: { strategy: 'succeed' },
                            metadata: {
                                revision: 2,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: mapFailed });
                        publishDomainEvent({ domainEvent: executed });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                                resolve();
                            }
                        ]));
                    });
                });
                test('does not mutate the domain event.', async () => {
                    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withDomainEventMap' });
                    application = await loadApplication_1.loadApplication({ applicationDirectory });
                    repository = new Repository_1.Repository({
                        application,
                        lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
                        domainEventStore,
                        snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
                        publisher,
                        pubSubChannelForNotifications
                    });
                    ({ api, publishDomainEvent } = await http_1.getApi({
                        corsOrigin: '*',
                        application,
                        repository,
                        identityProviders,
                        heartbeatInterval
                    }));
                    const aggregateId = uuid_1.v4();
                    const mapWithMutation = new DomainEventWithState_1.DomainEventWithState({
                        ...buildDomainEvent_1.buildDomainEvent({
                            aggregateIdentifier: {
                                context: { name: 'sampleContext' },
                                aggregate: { name: 'sampleAggregate', id: aggregateId }
                            },
                            name: 'mapWithMutation',
                            data: {},
                            metadata: {
                                revision: 1,
                                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                            }
                        }),
                        state: { previous: {}, next: {} }
                    });
                    setTimeout(async () => {
                        publishDomainEvent({ domainEvent: mapWithMutation });
                    }, 100);
                    const { client } = await runAsServer_1.runAsServer({ app: api });
                    const { data } = await client({
                        method: 'get',
                        url: '/v2/',
                        responseType: 'stream'
                    });
                    await new Promise((resolve, reject) => {
                        data.on('error', (err) => {
                            reject(err);
                        });
                        data.on('close', () => {
                            resolve();
                        });
                        data.pipe(asJsonStream_1.asJsonStream([
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                            },
                            (streamElement) => {
                                assertthat_1.assert.that(streamElement.name).is.equalTo('mapWithMutation');
                                resolve();
                            }
                        ]));
                    });
                    assertthat_1.assert.that(mapWithMutation.data.isMutated).is.undefined();
                });
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map