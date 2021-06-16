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
const AggregateInstance_1 = require("../../../../lib/common/domain/AggregateInstance");
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const buildCommandWithMetadata_1 = require("../../../../lib/common/utils/test/buildCommandWithMetadata");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const createDomainEventStore_1 = require("../../../../lib/stores/domainEventStore/createDomainEventStore");
const createLockStore_1 = require("../../../../lib/stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../lib/messaging/pubSub/createSubscriber");
const DomainEventWithState_1 = require("../../../../lib/common/elements/DomainEventWithState");
const getSnapshotStrategy_1 = require("../../../../lib/common/domain/getSnapshotStrategy");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const Repository_1 = require("../../../../lib/common/domain/Repository");
const streamtoarray_1 = require("streamtoarray");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('AggregateInstance', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    let aggregateId, aggregateInstance, application, domainEventStore, lockStore, publisher, pubSubChannelForNotifications, repository, subscriber;
    setup(async () => {
        aggregateId = uuid_1.v4();
        application = await loadApplication_1.loadApplication({ applicationDirectory });
        domainEventStore = await createDomainEventStore_1.createDomainEventStore({ type: 'InMemory' });
        lockStore = await createLockStore_1.createLockStore({ type: 'InMemory' });
        publisher = await createPublisher_1.createPublisher({ type: 'InMemory' });
        subscriber = await createSubscriber_1.createSubscriber({ type: 'InMemory' });
        pubSubChannelForNotifications = 'notifications';
        repository = new Repository_1.Repository({
            application,
            lockStore,
            domainEventStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            publisher,
            pubSubChannelForNotifications
        });
        aggregateInstance = await AggregateInstance_1.AggregateInstance.create({
            application,
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            lockStore,
            domainEventStore,
            repository,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy({ name: 'never' }),
            publisher,
            pubSubChannelForNotifications
        });
    });
    suite('aggregateIdentifier', () => {
        test('is initialized with the given value.', async () => {
            assertthat_1.assert.that(aggregateInstance.aggregateIdentifier).is.equalTo({
                context: {
                    name: 'sampleContext'
                },
                aggregate: {
                    name: 'sampleAggregate',
                    id: aggregateId
                }
            });
        });
    });
    suite('state', () => {
        test('is initialized with the given value.', async () => {
            assertthat_1.assert.that(aggregateInstance.state).is.equalTo({
                domainEventNames: []
            });
        });
    });
    suite('revision', () => {
        test('is initialized with the given value.', async () => {
            assertthat_1.assert.that(aggregateInstance.revision).is.equalTo(0);
        });
    });
    suite('unstoredDomainEvents', () => {
        test('is initialized with the given value.', async () => {
            assertthat_1.assert.that(aggregateInstance.unstoredDomainEvents).is.equalTo([]);
        });
    });
    suite('applySnapshot', () => {
        test(`throws an error if the id of the snapshot's aggregate identifier does not match.`, async () => {
            const snapshotAggregateIdentifierId = uuid_1.v4();
            assertthat_1.assert.that(() => {
                aggregateInstance.applySnapshot({
                    snapshot: {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: snapshotAggregateIdentifierId }
                        },
                        revision: 1,
                        state: {
                            domainEventNames: ['executed']
                        }
                    }
                });
            }).is.throwing((ex) => ex.code === errors.IdentifierMismatch.code && ex.message === 'Failed to apply snapshot. Aggregate id does not match.');
        });
        test('updates the state.', async () => {
            aggregateInstance.applySnapshot({
                snapshot: {
                    aggregateIdentifier: aggregateInstance.aggregateIdentifier,
                    revision: 1,
                    state: {
                        domainEventNames: ['executed']
                    }
                }
            });
            assertthat_1.assert.that(aggregateInstance.state).is.equalTo({
                domainEventNames: ['executed']
            });
        });
        test('updates the revision.', async () => {
            aggregateInstance.applySnapshot({
                snapshot: {
                    aggregateIdentifier: aggregateInstance.aggregateIdentifier,
                    revision: 1,
                    state: {
                        domainEventNames: ['executed']
                    }
                }
            });
            assertthat_1.assert.that(aggregateInstance.revision).is.equalTo(1);
        });
    });
    suite('isPristine', () => {
        test('returns true when the revision is 0.', async () => {
            assertthat_1.assert.that(aggregateInstance.isPristine()).is.true();
        });
        test('returns false when the revision is greater than 0.', async () => {
            aggregateInstance.applySnapshot({
                snapshot: {
                    aggregateIdentifier: aggregateInstance.aggregateIdentifier,
                    revision: 1,
                    state: {
                        domainEventNames: ['executed']
                    }
                }
            });
            assertthat_1.assert.that(aggregateInstance.isPristine()).is.false();
        });
    });
    suite('applyDomainEvent', () => {
        test('throws an error if the context name does not match.', async () => {
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'nonExistent' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'executed',
                data: {
                    strategy: 'succeed'
                },
                metadata: {
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    revision: 1
                }
            });
            assertthat_1.assert.that(() => {
                aggregateInstance.applyDomainEvent({ application, domainEvent });
            }).is.throwing('Context name does not match.');
        });
        test('throws an error if the aggregate name does not match.', async () => {
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'nonExistent', id: aggregateId }
                },
                name: 'executed',
                data: {
                    strategy: 'succeed'
                },
                metadata: {
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    revision: 1
                }
            });
            assertthat_1.assert.that(() => {
                aggregateInstance.applyDomainEvent({ application, domainEvent });
            }).is.throwing('Aggregate name does not match.');
        });
        test('throws an error if the aggregate id does not match.', async () => {
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                },
                name: 'executed',
                data: {
                    strategy: 'succeed'
                },
                metadata: {
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    revision: 1
                }
            });
            assertthat_1.assert.that(() => {
                aggregateInstance.applyDomainEvent({ application, domainEvent });
            }).is.throwing('Aggregate id does not match.');
        });
        test('throws an error if the event is not known.', async () => {
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'nonExistent',
                data: {
                    strategy: 'succeed'
                },
                metadata: {
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    revision: 1
                }
            });
            assertthat_1.assert.that(() => {
                aggregateInstance.applyDomainEvent({ application, domainEvent });
            }).is.throwing(`Failed to apply unknown domain event 'nonExistent' in 'sampleContext.sampleAggregate'.`);
        });
        test('returns the next state.', async () => {
            const domainEvent = buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'executed',
                data: {
                    strategy: 'succeed'
                },
                metadata: {
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    revision: 1
                }
            });
            const nextState = aggregateInstance.applyDomainEvent({ application, domainEvent });
            assertthat_1.assert.that(nextState).is.equalTo({
                domainEventNames: ['executed']
            });
        });
    });
    suite('handleCommand', () => {
        suite('validation', () => {
            test(`throws an error if the data of a command doesn't match its schema.`, async () => {
                const aggregateIdentifier = { context: { name: 'sampleContext' },
                    aggregate: {
                        name: 'sampleAggregate',
                        id: uuid_1.v4()
                    } };
                const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier,
                    name: 'execute',
                    data: {
                        foo: 'bar'
                    }
                });
                await assertthat_1.assert.that(async () => await aggregateInstance.handleCommand({
                    command
                })).is.throwingAsync((ex) => ex.code === errors.CommandMalformed.code &&
                    ex.message === 'Missing required property: strategy (at command.data.strategy).');
            });
        });
        suite('authorization', () => {
            test(`publishes (and does not store) a rejected event if the sender of a command is not authorized.`, async () => {
                const { aggregateIdentifier } = aggregateInstance;
                const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier,
                    name: 'authorize',
                    data: {
                        shouldAuthorize: false
                    }
                });
                const domainEvents = await aggregateInstance.handleCommand({
                    command
                });
                assertthat_1.assert.that(domainEvents.length).is.equalTo(1);
                assertthat_1.assert.that(domainEvents[0]).is.atLeast({
                    aggregateIdentifier,
                    name: 'authorizeRejected',
                    data: {
                        reason: 'Command not authorized.'
                    }
                });
                assertthat_1.assert.that(await domainEventStore.getLastDomainEvent({ aggregateIdentifier })).is.undefined();
            });
            test('passes the correct state to the isAuthorized handler.', async () => {
                const { aggregateIdentifier } = aggregateInstance;
                const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier,
                    name: 'authorize',
                    data: {
                        shouldAuthorize: true
                    }
                });
                const domainEvents = await aggregateInstance.handleCommand({
                    command
                });
                assertthat_1.assert.that(domainEvents.length).is.equalTo(1);
                assertthat_1.assert.that(domainEvents[0]).is.atLeast({
                    aggregateIdentifier,
                    name: 'authorized',
                    data: {}
                });
                assertthat_1.assert.that(await domainEventStore.getLastDomainEvent({ aggregateIdentifier })).is.not.undefined();
            });
        });
        suite('handling', () => {
            test('publishes (and stores) an appropriate event for the incoming command.', async () => {
                const { aggregateIdentifier } = aggregateInstance;
                const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier,
                    name: 'execute',
                    data: {
                        strategy: 'succeed'
                    }
                });
                const domainEvents = await aggregateInstance.handleCommand({
                    command
                });
                assertthat_1.assert.that(domainEvents.length).is.equalTo(2);
                assertthat_1.assert.that(domainEvents[0]).is.atLeast({
                    aggregateIdentifier,
                    name: 'succeeded',
                    data: {}
                });
                assertthat_1.assert.that(domainEvents[1]).is.atLeast({
                    aggregateIdentifier,
                    name: 'executed',
                    data: {
                        strategy: 'succeed'
                    }
                });
                const eventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.aggregate.id });
                await new Promise((resolve, reject) => {
                    eventStream.on('error', (err) => {
                        reject(err);
                    });
                    eventStream.on('close', () => {
                        resolve();
                    });
                    eventStream.pipe(asJsonStream_1.asJsonStream([
                        (data) => {
                            try {
                                assertthat_1.assert.that(data).is.atLeast({
                                    aggregateIdentifier,
                                    name: 'succeeded',
                                    data: {}
                                });
                                resolve();
                            }
                            catch (ex) {
                                reject(ex);
                            }
                        },
                        (data) => {
                            try {
                                assertthat_1.assert.that(data).is.atLeast({
                                    aggregateIdentifier,
                                    name: 'executed',
                                    data: {
                                        strategy: 'succeed'
                                    }
                                });
                                resolve();
                            }
                            catch (ex) {
                                reject(ex);
                            }
                        },
                        () => {
                            reject(new Error('Should only have received twe messages.'));
                        }
                    ], true));
                });
            });
            test('updates the state.', async () => {
                const { aggregateIdentifier } = aggregateInstance;
                const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier,
                    name: 'execute',
                    data: {
                        strategy: 'succeed'
                    }
                });
                await aggregateInstance.handleCommand({
                    command
                });
                // Since state is being replaced internally when handling a command with a new instance,
                // using destructuring for getting the state does not work, since then you'd only have
                // a reference to the old state. Hence we need to disable this ESLint rule here.
                // eslint-disable-next-line unicorn/consistent-destructuring
                assertthat_1.assert.that(aggregateInstance.state).is.equalTo({
                    domainEventNames: ['succeeded', 'executed']
                });
            });
            test('publishes (and does not store) a rejected event if a handler rejects.', async () => {
                const { aggregateIdentifier } = aggregateInstance;
                const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier,
                    name: 'execute',
                    data: {
                        strategy: 'reject'
                    }
                });
                const domainEvents = await aggregateInstance.handleCommand({
                    command
                });
                assertthat_1.assert.that(domainEvents.length).is.equalTo(1);
                assertthat_1.assert.that(domainEvents[0]).is.atLeast({
                    aggregateIdentifier,
                    name: 'executeRejected',
                    data: {
                        reason: 'Intentionally rejected execute.'
                    }
                });
                assertthat_1.assert.that(await domainEventStore.getLastDomainEvent({ aggregateIdentifier })).is.undefined();
            });
            test('publishes (and does not store) a failed event if a handler throws an unknow exception.', async () => {
                const { aggregateIdentifier } = aggregateInstance;
                const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier,
                    name: 'execute',
                    data: {
                        strategy: 'fail'
                    }
                });
                const domainEvents = await aggregateInstance.handleCommand({
                    command
                });
                assertthat_1.assert.that(domainEvents.length).is.equalTo(1);
                assertthat_1.assert.that(domainEvents[0]).is.atLeast({
                    aggregateIdentifier,
                    name: 'executeFailed',
                    data: {
                        reason: 'Intentionally failed execute.'
                    }
                });
                assertthat_1.assert.that(await domainEventStore.getLastDomainEvent({ aggregateIdentifier })).is.undefined();
            });
        });
        suite('notifications', () => {
            test('publishes notifications from the command handle.', async () => {
                const notifications = [];
                await subscriber.subscribe({
                    channel: pubSubChannelForNotifications,
                    callback(notification) {
                        notifications.push(notification);
                    }
                });
                const { aggregateIdentifier } = aggregateInstance;
                const command = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier,
                    name: 'execute',
                    data: {
                        strategy: 'succeed'
                    }
                });
                await aggregateInstance.handleCommand({
                    command
                });
                assertthat_1.assert.that(notifications.length).is.equalTo(1);
                assertthat_1.assert.that(notifications[0]).is.equalTo({
                    name: 'commandExecute',
                    data: {},
                    metadata: undefined
                });
            });
        });
    });
    suite('storeCurrentAggregateState', () => {
        test('does nothing if there are no unstored domain events.', async () => {
            await aggregateInstance.storeCurrentAggregateState();
            const domainEventStream = await domainEventStore.getReplayForAggregate({
                aggregateId
            });
            const domainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(domainEvents.length).is.equalTo(0);
        });
        test('stores a single unstored domain event to the domain event store.', async () => {
            aggregateInstance.unstoredDomainEvents.push(new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateInstance.aggregateIdentifier,
                    name: 'executed',
                    data: {
                        strategy: 'succeed'
                    },
                    metadata: {
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        revision: 1
                    }
                }),
                state: {
                    previous: {
                        domainEventNames: []
                    },
                    next: {
                        domainEventNames: ['executed']
                    }
                }
            }));
            await aggregateInstance.storeCurrentAggregateState();
            const domainEventStream = await domainEventStore.getReplayForAggregate({
                aggregateId
            });
            const domainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(domainEvents.length).is.equalTo(1);
            assertthat_1.assert.that(domainEvents[0].name).is.equalTo('executed');
            assertthat_1.assert.that(domainEvents[0].data).is.equalTo({
                strategy: 'succeed'
            });
        });
        test('stores multiple unstored domain events to the domain event store.', async () => {
            aggregateInstance.unstoredDomainEvents.push(new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateInstance.aggregateIdentifier,
                    name: 'succeeded',
                    data: {},
                    metadata: {
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        revision: 1
                    }
                }),
                state: {
                    previous: {
                        domainEventNames: []
                    },
                    next: {
                        domainEventNames: ['succeeded']
                    }
                }
            }));
            aggregateInstance.unstoredDomainEvents.push(new DomainEventWithState_1.DomainEventWithState({
                ...buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: aggregateInstance.aggregateIdentifier,
                    name: 'executed',
                    data: {
                        strategy: 'succeed'
                    },
                    metadata: {
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                        revision: 2
                    }
                }),
                state: {
                    previous: {
                        domainEventNames: ['succeeded']
                    },
                    next: {
                        domainEventNames: ['succeeded', 'executed']
                    }
                }
            }));
            await aggregateInstance.storeCurrentAggregateState();
            const domainEventStream = await domainEventStore.getReplayForAggregate({
                aggregateId
            });
            const domainEvents = await streamtoarray_1.toArray(domainEventStream);
            assertthat_1.assert.that(domainEvents.length).is.equalTo(2);
            assertthat_1.assert.that(domainEvents[0].name).is.equalTo('succeeded');
            assertthat_1.assert.that(domainEvents[0].data).is.equalTo({});
            assertthat_1.assert.that(domainEvents[1].name).is.equalTo('executed');
            assertthat_1.assert.that(domainEvents[1].data).is.equalTo({
                strategy: 'succeed'
            });
        });
    });
});
//# sourceMappingURL=AggregateInstanceTests.js.map