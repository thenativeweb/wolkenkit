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
const assertthat_1 = require("assertthat");
const buildCommandWithMetadata_1 = require("../../../../lib/common/utils/test/buildCommandWithMetadata");
const Client_1 = require("../../../../lib/apis/awaitItem/http/v2/Client");
const CommandWithMetadata_1 = require("../../../../lib/common/elements/CommandWithMetadata");
const createPriorityQueueStore_1 = require("../../../../lib/stores/priorityQueueStore/createPriorityQueueStore");
const doesItemIdentifierWithClientMatchCommandWithMetadata_1 = require("../../../../lib/common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata");
const http_1 = require("../../../../lib/apis/awaitItem/http");
const getCommandWithMetadataSchema_1 = require("../../../../lib/common/schemas/getCommandWithMetadataSchema");
const getPromiseStatus_1 = require("../../../../lib/common/utils/getPromiseStatus");
const InMemoryPublisher_1 = require("../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher");
const InMemorySubscriber_1 = require("../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber");
const validate_value_1 = require("validate-value");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const sleep_1 = require("../../../../lib/common/utils/sleep");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
const commandWithMetadataParser = new validate_value_1.Parser(getCommandWithMetadataSchema_1.getCommandWithMetadataSchema());
suite('awaitItem/http/Client', () => {
    suite('/v2', () => {
        const expirationTime = 600;
        const pollInterval = 500;
        let api, newItemPublisher, newItemSubscriber, newItemSubscriberChannel, priorityQueueStore;
        setup(async () => {
            newItemSubscriber = await InMemorySubscriber_1.InMemorySubscriber.create({ type: 'InMemory' });
            newItemSubscriberChannel = uuid_1.v4();
            newItemPublisher = await InMemoryPublisher_1.InMemoryPublisher.create({ type: 'InMemory' });
            priorityQueueStore = await createPriorityQueueStore_1.createPriorityQueueStore({
                type: 'InMemory',
                doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata_1.doesItemIdentifierWithClientMatchCommandWithMetadata,
                expirationTime
            });
            ({ api } = await http_1.getApi({
                corsOrigin: '*',
                priorityQueueStore: priorityQueueStore,
                newItemSubscriber,
                newItemSubscriberChannel,
                validateOutgoingItem({ item }) {
                    commandWithMetadataParser.parse(item).unwrapOrThrow();
                }
            }));
        });
        suite('awaitItem', () => {
            test('retrieves a lock item.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: 'foo',
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                const command = await client.awaitItem();
                assertthat_1.assert.that(command.item).is.equalTo(commandWithMetadata);
                assertthat_1.assert.that(command.metadata.token).is.ofType('string');
                assertthat_1.assert.that(command.metadata.discriminator).is.equalTo('foo');
            });
            test('throws a StreamClosedUnexpectedly error if an internal error occurs in the API.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => item
                });
                const commandWithMetadata = { foo: 'bar' };
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: 'foo',
                    priority: Date.now()
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await assertthat_1.assert.that(async () => {
                    await client.awaitItem();
                }).is.throwingAsync((ex) => ex.code === errors.StreamClosedUnexpectedly.code);
            });
        });
        suite('renewLock', () => {
            test('throws a request malformed error if the discriminator is too short.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                await assertthat_1.assert.that(async () => await client.renewLock({
                    discriminator: '',
                    token: uuid_1.v4()
                })).is.throwingAsync((ex) => ex.code === errors.RequestMalformed.code &&
                    ex.message === 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).');
            });
            test(`throws an item not found error if the item doesn't exist.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                await assertthat_1.assert.that(async () => client.renewLock({
                    discriminator: uuid_1.v4(),
                    token: uuid_1.v4()
                })).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code);
            });
            test(`throws an item not locked error if the item isn't locked.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await assertthat_1.assert.that(async () => client.renewLock({
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    token: uuid_1.v4()
                })).is.throwingAsync((ex) => ex.code === errors.ItemNotLocked.code);
            });
            test(`throws a token mismatched error if the token doesn't match.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await client.awaitItem();
                await assertthat_1.assert.that(async () => client.renewLock({
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    token: uuid_1.v4()
                })).is.throwingAsync((ex) => ex.code === errors.TokenMismatch.code &&
                    ex.message === `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`);
            });
            test('extends the lock expiry time.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                const { item, metadata: { token } } = await client.awaitItem();
                await sleep_1.sleep({ ms: 0.6 * expirationTime });
                await client.renewLock({ discriminator: item.aggregateIdentifier.aggregate.id, token });
                await sleep_1.sleep({ ms: 0.6 * expirationTime });
                const notResolvingPromise = client.awaitItem();
                await sleep_1.sleep({ ms: pollInterval });
                assertthat_1.assert.that(await getPromiseStatus_1.getPromiseStatus(notResolvingPromise)).is.equalTo('pending');
            });
        });
        suite('acknowledge', () => {
            test('throws a request malformed error if the discriminator is too short.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                await assertthat_1.assert.that(async () => await client.acknowledge({
                    discriminator: '',
                    token: uuid_1.v4()
                })).is.throwingAsync((ex) => ex.code === errors.RequestMalformed.code &&
                    ex.message === 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).');
            });
            test(`throws an item not found error if the item doesn't exist.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                await assertthat_1.assert.that(async () => client.acknowledge({
                    discriminator: uuid_1.v4(),
                    token: uuid_1.v4()
                })).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code);
            });
            test(`throws an item not locked error if the item isn't locked.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await assertthat_1.assert.that(async () => client.acknowledge({
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    token: uuid_1.v4()
                })).is.throwingAsync((ex) => ex.code === errors.ItemNotLocked.code);
            });
            test(`throws a token mismatched error if the token doesn't match.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await client.awaitItem();
                await assertthat_1.assert.that(async () => client.acknowledge({
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    token: uuid_1.v4()
                })).is.throwingAsync((ex) => ex.code === errors.TokenMismatch.code &&
                    ex.message === `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`);
            });
            test('removes the item from the queue and lets the next item for the same aggregate pass.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const aggregateId = uuid_1.v4();
                const commandOne = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: aggregateId
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                const commandTwo = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: aggregateId
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandOne,
                    discriminator: commandOne.aggregateIdentifier.aggregate.id,
                    priority: commandOne.metadata.timestamp
                });
                await priorityQueueStore.enqueue({
                    item: commandTwo,
                    discriminator: commandTwo.aggregateIdentifier.aggregate.id,
                    priority: commandTwo.metadata.timestamp
                });
                const { item, metadata: { token } } = await client.awaitItem();
                const commandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata(item);
                await client.acknowledge({
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    token
                });
                // This should resolve. A timeout in this test means, that this can not
                // fetch a command.
                await client.awaitItem();
            });
        });
        suite('defer', () => {
            test('throws a request malformed error if the discriminator is too short.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                await assertthat_1.assert.that(async () => await client.defer({
                    discriminator: '',
                    token: uuid_1.v4(),
                    priority: Date.now()
                })).is.throwingAsync((ex) => ex.code === errors.RequestMalformed.code &&
                    ex.message === 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).');
            });
            test(`throws an item not found error if the item doesn't exist.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                await assertthat_1.assert.that(async () => client.defer({
                    discriminator: uuid_1.v4(),
                    token: uuid_1.v4(),
                    priority: Date.now()
                })).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code);
            });
            test(`throws an item not locked error if the item isn't locked.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await assertthat_1.assert.that(async () => client.defer({
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    token: uuid_1.v4(),
                    priority: Date.now()
                })).is.throwingAsync((ex) => ex.code === errors.ItemNotLocked.code);
            });
            test(`throws a token mismatched error if the token doesn't match.`, async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
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
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await client.awaitItem();
                await assertthat_1.assert.that(async () => client.defer({
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    token: uuid_1.v4(),
                    priority: Date.now()
                })).is.throwingAsync((ex) => ex.code === errors.TokenMismatch.code &&
                    ex.message === `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`);
            });
            test('removes the item from the queue and lets the next item for the same aggregate pass.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2',
                    createItemInstance: ({ item }) => new CommandWithMetadata_1.CommandWithMetadata(item)
                });
                const aggregateId = uuid_1.v4();
                const commandOne = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: aggregateId
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                const commandTwo = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: aggregateId
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandOne,
                    discriminator: commandOne.aggregateIdentifier.aggregate.id,
                    priority: commandOne.metadata.timestamp
                });
                await priorityQueueStore.enqueue({
                    item: commandTwo,
                    discriminator: commandTwo.aggregateIdentifier.aggregate.id,
                    priority: commandTwo.metadata.timestamp
                });
                const { item, metadata: { token } } = await client.awaitItem();
                const commandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata(item);
                await client.defer({
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    token,
                    priority: Date.now()
                });
                const { item: nextItem, metadata: { token: nextToken } } = await client.awaitItem();
                const nextCommandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata(nextItem);
                await client.acknowledge({
                    discriminator: nextCommandWithMetadata.aggregateIdentifier.aggregate.id,
                    token: nextToken
                });
                // This should resolve. A timeout in this test means, that this can not
                // fetch a command.
                await client.awaitItem();
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map