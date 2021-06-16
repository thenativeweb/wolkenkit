"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const lodash_1 = require("lodash");
const CommandWithMetadata_1 = require("../../../../lib/common/elements/CommandWithMetadata");
const createLockStore_1 = require("../../../../lib/stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const getAggregateService_1 = require("../../../../lib/common/services/getAggregateService");
const getSnapshotStrategy_1 = require("../../../../lib/common/domain/getSnapshotStrategy");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const InMemory_1 = require("../../../../lib/stores/domainEventStore/InMemory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const Repository_1 = require("../../../../lib/common/domain/Repository");
const uuid_1 = require("uuid");
suite('getAggregateService', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const contextName = 'sampleContext';
    const aggregateName = 'sampleAggregate';
    const commandName = 'execute';
    const domainEventName = 'executed';
    const commandId = uuid_1.v4();
    const user = {
        id: 'jane.doe',
        claims: {
            sub: 'jane.doe'
        }
    };
    const command = new CommandWithMetadata_1.CommandWithMetadata({
        aggregateIdentifier: {
            context: { name: contextName },
            aggregate: { id: uuid_1.v4(), name: aggregateName }
        },
        name: commandName,
        data: {
            strategy: 'succeed'
        },
        id: commandId,
        metadata: {
            causationId: commandId,
            correlationId: uuid_1.v4(),
            client: { ip: '127.0.0.0', token: 'some-token', user },
            initiator: { user },
            timestamp: Date.now()
        }
    });
    let aggregateInstance, aggregateService, application, domainEventHandlerCalled = false, domainEventStore, lockStore, publisher, pubSubChannelForNotifications, repository;
    suiteSetup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    setup(async () => {
        domainEventHandlerCalled = false;
        /* eslint-disable @typescript-eslint/unbound-method */
        const handleFunction = application.domain[contextName][aggregateName].domainEventHandlers[domainEventName].handle;
        /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
        application.domain[contextName][aggregateName].domainEventHandlers[domainEventName].handle =
            function (state, domainEvent, services) {
                domainEventHandlerCalled = true;
                return handleFunction(state, domainEvent, services);
            };
        /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
        /* eslint-enable @typescript-eslint/unbound-method */
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
        aggregateInstance = await repository.getAggregateInstance({
            aggregateIdentifier: {
                context: {
                    name: contextName
                },
                aggregate: {
                    name: aggregateName,
                    id: uuid_1.v4()
                }
            }
        });
        aggregateService = getAggregateService_1.getAggregateService({ aggregateInstance, application, command });
    });
    suite('id', () => {
        test(`returns the aggregate's id.`, async () => {
            assertthat_1.assert.that(aggregateService.id()).is.equalTo(aggregateInstance.aggregateIdentifier.aggregate.id);
        });
    });
    suite('isPristine', () => {
        test(`uses the aggregate's isPristine method.`, async () => {
            let isPristineCalled = false;
            /* eslint-disable @typescript-eslint/unbound-method */
            aggregateInstance.isPristine = function () {
                isPristineCalled = true;
                return true;
            };
            /* eslint-enable @typescript-eslint/unbound-method */
            const isPristine = aggregateService.isPristine();
            assertthat_1.assert.that(isPristine).is.true();
            assertthat_1.assert.that(isPristineCalled).is.true();
        });
    });
    suite('publishDomainEvent', () => {
        test(`applies the given domain event to the aggregate and returns the new state.`, async () => {
            const previousAggregateState = lodash_1.cloneDeep(aggregateInstance.state);
            const domainEventData = { strategy: 'succeed' };
            const nextState = aggregateService.publishDomainEvent(domainEventName, domainEventData);
            const generatedDomainEvent = aggregateInstance.unstoredDomainEvents[0];
            assertthat_1.assert.that(generatedDomainEvent.data).is.equalTo(domainEventData);
            assertthat_1.assert.that(generatedDomainEvent.metadata.causationId).is.equalTo(command.id);
            assertthat_1.assert.that(generatedDomainEvent.metadata.correlationId).is.equalTo(command.metadata.correlationId);
            assertthat_1.assert.that(generatedDomainEvent.metadata.initiator).is.equalTo(command.metadata.initiator);
            assertthat_1.assert.that(generatedDomainEvent.metadata.revision).is.equalTo(1);
            assertthat_1.assert.that(generatedDomainEvent.data).is.equalTo(domainEventData);
            assertthat_1.assert.that(generatedDomainEvent.state.previous).is.equalTo(previousAggregateState);
            assertthat_1.assert.that(generatedDomainEvent.state.next).is.equalTo(nextState);
            assertthat_1.assert.that(domainEventHandlerCalled).is.true();
        });
        test('throws an error if the published domain event is unknown.', async () => {
            const unknownDomainEventName = 'someUnknownDomainEvent';
            assertthat_1.assert.that(() => {
                aggregateService.publishDomainEvent(unknownDomainEventName, {});
            }).is.throwing(`Failed to publish unknown domain event '${unknownDomainEventName}' in '${contextName}.${aggregateName}'.`);
        });
        test(`throws an error if the published domain event's data does not match its schema.`, async () => {
            assertthat_1.assert.that(() => {
                aggregateService.publishDomainEvent(domainEventName, { foo: 'bar' });
            }).is.throwing('Missing required property: strategy (at data.strategy).');
        });
    });
});
//# sourceMappingURL=getAggregateServiceTests.js.map