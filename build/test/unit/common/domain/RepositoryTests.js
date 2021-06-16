"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const createLockStore_1 = require("../../../../lib/stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const getSnapshotStrategy_1 = require("../../../../lib/common/domain/getSnapshotStrategy");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const InMemory_1 = require("../../../../lib/stores/domainEventStore/InMemory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const Repository_1 = require("../../../../lib/common/domain/Repository");
const uuid_1 = require("uuid");
suite('Repository', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    let aggregateId, application, domainEventStore, lockStore, publisher, pubSubChannelForNotifications, repository;
    setup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        aggregateId = uuid_1.v4();
        domainEventStore = await InMemory_1.InMemoryDomainEventStore.create({ type: 'InMemory' });
        lockStore = await createLockStore_1.createLockStore({ type: 'InMemory' });
        publisher = await createPublisher_1.createPublisher({ type: 'InMemory' });
        pubSubChannelForNotifications = 'notifications';
        repository = new Repository_1.Repository({
            application,
            lockStore,
            domainEventStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            publisher,
            pubSubChannelForNotifications
        });
    });
    teardown(async () => {
        await domainEventStore.destroy();
    });
    suite('getAggregateInstance', () => {
        test('returns the current state of the requested aggregate.', async () => {
            const domainEventSucceeded = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'succeeded',
                data: {},
                metadata: {
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    revision: 1
                }
            });
            const domainEventExecuted = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'executed',
                data: { strategy: 'succeed' },
                metadata: {
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    revision: 2
                }
            });
            await domainEventStore.storeDomainEvents({
                domainEvents: [domainEventSucceeded, domainEventExecuted]
            });
            const aggregateInstance = await repository.getAggregateInstance({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                }
            });
            assertthat_1.assert.that(aggregateInstance.state).is.equalTo({
                domainEventNames: ['succeeded', 'executed']
            });
            assertthat_1.assert.that(aggregateInstance.revision).is.equalTo(2);
        });
        test('stores a snapshot if the snapshot strategy evaluates to true.', async () => {
            repository = new Repository_1.Repository({
                application,
                lockStore,
                domainEventStore,
                snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'always' }),
                publisher,
                pubSubChannelForNotifications
            });
            const aggregateIdentifier = {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            };
            const domainEvents = [
                buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        revision: 1
                    }
                }),
                buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        revision: 2
                    }
                }),
                buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        revision: 3
                    }
                })
            ];
            await domainEventStore.storeDomainEvents({ domainEvents });
            await repository.getAggregateInstance({
                aggregateIdentifier
            });
            const latestSnapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
            assertthat_1.assert.that(latestSnapshot).is.not.undefined();
            assertthat_1.assert.that(latestSnapshot === null || latestSnapshot === void 0 ? void 0 : latestSnapshot.revision).is.equalTo(3);
        });
        test('does not call the snapshot strategy if no domain events have been replayed.', async () => {
            let snapshotStrategyCalled = false;
            const snapshotStrategy = () => {
                snapshotStrategyCalled = true;
                return false;
            };
            repository = new Repository_1.Repository({
                application,
                lockStore,
                domainEventStore,
                snapshotStrategy,
                publisher,
                pubSubChannelForNotifications
            });
            const aggregateIdentifier = {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            };
            await repository.getAggregateInstance({
                aggregateIdentifier
            });
            assertthat_1.assert.that(snapshotStrategyCalled).is.false();
        });
    });
});
//# sourceMappingURL=RepositoryTests.js.map