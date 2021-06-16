"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const createLockStore_1 = require("../../../../lib/stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const getAggregatesService_1 = require("../../../../lib/common/services/getAggregatesService");
const getSnapshotStrategy_1 = require("../../../../lib/common/domain/getSnapshotStrategy");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const InMemory_1 = require("../../../../lib/stores/domainEventStore/InMemory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const Repository_1 = require("../../../../lib/common/domain/Repository");
const uuid_1 = require("uuid");
suite('getAggregatesService', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    let application, domainEventStore, lockStore, publisher, pubSubChannelForNotifications, repository;
    suiteSetup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    setup(async () => {
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
    test('returns an AggregatesService if everything is fine.', async () => {
        const aggregatesService = getAggregatesService_1.getAggregatesService({ repository });
        assertthat_1.assert.that(aggregatesService.read).is.ofType('function');
    });
    suite('AggregatesService', () => {
        test('returns the current state of a requested aggregate.', async () => {
            const id = uuid_1.v4();
            const user = {
                id: 'jane.doe',
                claims: {
                    sub: 'jane.doe'
                }
            };
            const sampleDomainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id }
                },
                name: 'succeeded',
                data: {},
                metadata: {
                    initiator: { user },
                    revision: 1
                }
            });
            await domainEventStore.storeDomainEvents({ domainEvents: [sampleDomainEvent] });
            const aggregatesService = getAggregatesService_1.getAggregatesService({ repository });
            const sampleAggregateState = await aggregatesService.read({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id }
                }
            });
            assertthat_1.assert.that(sampleAggregateState).is.equalTo({
                domainEventNames: ['succeeded']
            });
        });
        test('throws an error if a requested aggregate does not exist.', async () => {
            const aggregatesService = getAggregatesService_1.getAggregatesService({ repository });
            const id = uuid_1.v4();
            await assertthat_1.assert.that(async () => {
                await aggregatesService.read({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id }
                    }
                });
            }).is.throwingAsync(`Aggregate 'sampleContext.sampleAggregate.${id}' not found.`);
        });
    });
});
//# sourceMappingURL=getAggregatesServiceTests.js.map