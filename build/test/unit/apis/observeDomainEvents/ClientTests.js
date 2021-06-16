"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const Client_1 = require("../../../../lib/apis/observeDomainEvents/http/v2/Client");
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
const uuid_1 = require("uuid");
suite('observeDomainEvents/http/Client', function () {
    this.timeout(5000);
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
        suite('getDescription', () => {
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
            test(`returns the domain events' descriptions.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const data = await client.getDescription();
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
        suite('getDomainEvents', () => {
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
            test('delivers a single domain event.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const data = await client.getDomainEvents({});
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ], true));
                });
            });
            test('delivers multiple domain events.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: succeeded });
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const data = await client.getDomainEvents({});
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('succeeded');
                            assertthat_1.assert.that(streamElement.data).is.equalTo({});
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                            assertthat_1.assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ], true));
                });
            });
            test('delivers filtered domain events.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: succeeded });
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const data = await client.getDomainEvents({ filter: { name: 'executed' } });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                            assertthat_1.assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ], true));
                });
            });
            test('delivers filtered domain events with a nested filter.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: succeeded });
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const data = await client.getDomainEvents({ filter: {
                        aggregateIdentifier: { context: { name: 'sampleContext' } },
                        name: 'executed'
                    } });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.name).is.equalTo('executed');
                            assertthat_1.assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
                            resolve();
                        }
                    ], true));
                });
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                setTimeout(async () => {
                    publishDomainEvent({ domainEvent: executed });
                }, 100);
                const data = await client.getDomainEvents({});
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.state).is.undefined();
                            resolve();
                        }
                    ], true));
                });
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map