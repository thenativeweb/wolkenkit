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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestsFor = void 0;
const assertthat_1 = require("assertthat");
const buildCommandWithMetadata_1 = require("../../../../lib/common/utils/test/buildCommandWithMetadata");
const getShortId_1 = require("../../../shared/getShortId");
const p_forever_1 = __importDefault(require("p-forever"));
const sleep_1 = require("../../../../lib/common/utils/sleep");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
const errors = __importStar(require("../../../../lib/common/errors"));
/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createPriorityQueueStore }) {
    const expirationTime = 250;
    const firstAggregateId = uuid_1.v4(), secondAggregateId = uuid_1.v4();
    const commands = {
        firstAggregate: {
            firstCommand: buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: firstAggregateId }
                },
                name: 'execute',
                data: { strategy: 'succeed' },
                metadata: { timestamp: Date.now() + 0 }
            }),
            secondCommand: buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: firstAggregateId }
                },
                name: 'execute',
                data: { strategy: 'succeed' },
                metadata: { timestamp: Date.now() + 1 }
            }),
            emojiCommand: buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: firstAggregateId }
                },
                name: 'execute',
                data: { strategy: 'succeed', dingus: '🐵 🙈 🙉 🙊' },
                metadata: { timestamp: Date.now() + 4 }
            })
        },
        secondAggregate: {
            firstCommand: buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: secondAggregateId }
                },
                name: 'execute',
                data: { strategy: 'succeed' },
                metadata: { timestamp: Date.now() + 2 }
            }),
            secondCommand: buildCommandWithMetadata_1.buildCommandWithMetadata({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: secondAggregateId }
                },
                name: 'execute',
                data: { strategy: 'succeed' },
                metadata: { timestamp: Date.now() + 3 }
            })
        }
    };
    let priorityQueueStore, suffix;
    setup(async () => {
        suffix = getShortId_1.getShortId();
        priorityQueueStore = await createPriorityQueueStore({ suffix, expirationTime });
        await priorityQueueStore.setup();
    });
    teardown(async function () {
        this.timeout(20 * 1000);
        await priorityQueueStore.destroy();
    });
    suite('enqueue', () => {
        test('enqueues the given command.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { item: nextCommand } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(nextCommand).is.equalTo(commands.firstAggregate.firstCommand);
        });
        test('enqueues the same command twice if told so.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.enqueue({
                    item: commands.firstAggregate.firstCommand,
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    priority: commands.firstAggregate.firstCommand.metadata.timestamp
                });
            }).is.not.throwingAsync();
        });
        test('enqueues a command with emoji in it.', async () => {
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.enqueue({
                    item: commands.firstAggregate.emojiCommand,
                    discriminator: commands.firstAggregate.emojiCommand.aggregateIdentifier.aggregate.id,
                    priority: commands.firstAggregate.emojiCommand.metadata.timestamp
                });
            }).is.not.throwingAsync();
        });
        test('enqueues multiple commands for the same aggregate.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.enqueue({
                    item: commands.firstAggregate.secondCommand,
                    discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.aggregate.id,
                    priority: commands.firstAggregate.secondCommand.metadata.timestamp
                });
            }).is.not.throwingAsync();
        });
        test('enqueues commands for multiple aggregates.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.enqueue({
                    item: commands.secondAggregate.firstCommand,
                    discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    priority: commands.secondAggregate.firstCommand.metadata.timestamp
                });
            }).is.not.throwingAsync();
        });
        test('enqueues commands with special characters in keys.', async () => {
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.enqueue({
                    item: {
                        'foo.bar': 'baz'
                    },
                    discriminator: 'foo',
                    priority: commands.firstAggregate.firstCommand.metadata.timestamp
                });
            }).is.not.throwingAsync();
        });
    });
    suite('lockNext', () => {
        test('returns undefined if there are no enqueued items.', async () => {
            const nextCommand = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(nextCommand).is.undefined();
        });
        test('returns a previously enqueued item.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { item: nextCommand } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(nextCommand).is.equalTo(commands.firstAggregate.firstCommand);
        });
        test('returns the discriminator for the locked item.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'foo',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { discriminator } } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(discriminator).is.equalTo('foo');
        });
        test('returns undefined if the queue of the enqueued items is locked.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.secondCommand,
                discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.secondCommand.metadata.timestamp
            });
            await priorityQueueStore.lockNext();
            const nextCommand = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(nextCommand).is.undefined();
        });
        test('returns enqueued items for independent aggregates.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.secondAggregate.firstCommand,
                discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.secondAggregate.firstCommand.metadata.timestamp
            });
            const { item: firstNextCommand } = (await priorityQueueStore.lockNext());
            const { item: secondNextCommand } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(firstNextCommand).is.equalTo(commands.firstAggregate.firstCommand);
            assertthat_1.assert.that(secondNextCommand).is.equalTo(commands.secondAggregate.firstCommand);
        });
        test('returns undefined if all queues of the enqueued items are locked.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.secondCommand,
                discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.secondCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.secondAggregate.firstCommand,
                discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.secondAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.secondAggregate.secondCommand,
                discriminator: commands.secondAggregate.secondCommand.aggregateIdentifier.aggregate.id,
                priority: commands.secondAggregate.secondCommand.metadata.timestamp
            });
            await priorityQueueStore.lockNext();
            await priorityQueueStore.lockNext();
            const nextCommand = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(nextCommand).is.undefined();
        });
        test('returns a previously locked item if its lock has expired.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { item: firstNextCommand } = (await priorityQueueStore.lockNext());
            await sleep_1.sleep({ ms: expirationTime * 1.5 });
            const { item: secondNextCommand } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(firstNextCommand).is.equalTo(secondNextCommand);
        });
        test('returns different tokens for each queue.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.secondAggregate.firstCommand,
                discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.secondAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { token: firstNextToken } } = (await priorityQueueStore.lockNext());
            const { metadata: { token: secondNextToken } } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(firstNextToken).is.not.equalTo(secondNextToken);
        });
        test('returns different tokens for a re-locked item whose lock had expired.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { token: firstNextToken } } = (await priorityQueueStore.lockNext());
            await sleep_1.sleep({ ms: expirationTime * 1.5 });
            const { metadata: { token: secondNextToken } } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(firstNextToken).is.not.equalTo(secondNextToken);
        });
        test(`returns an item if a locked queue's until timestamp is lower than all other priorities.`, async () => {
            const item1 = { id: uuid_1.v4() }, item2 = { id: uuid_1.v4() };
            await priorityQueueStore.enqueue({
                item: item1,
                discriminator: 'queue1',
                priority: Date.now()
            });
            await priorityQueueStore.enqueue({
                item: item2,
                discriminator: 'queue2',
                priority: Date.now() + (2 * expirationTime)
            });
            const firstLockResult = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(firstLockResult === null || firstLockResult === void 0 ? void 0 : firstLockResult.item).is.equalTo(item1);
            const secondLockResult = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(secondLockResult).is.not.undefined();
            assertthat_1.assert.that(secondLockResult === null || secondLockResult === void 0 ? void 0 : secondLockResult.item).is.equalTo(item2);
        });
    });
    suite('renewLock', () => {
        test('throws an error if the given item is not enqueued.', async () => {
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.renewLock({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'non-existent'
                });
            }).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code &&
                ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}' not found.`);
        });
        test('throws an error if the given item is not in a locked queue.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.renewLock({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'non-existent'
                });
            }).is.throwingAsync((ex) => ex.code === errors.ItemNotLocked.code &&
                ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}' not locked.`);
        });
        test('throws an error if the given token does not match.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.lockNext();
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.renewLock({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'wrong-token'
                });
            }).is.throwingAsync((ex) => ex.code === errors.TokenMismatch.code &&
                ex.message === `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}'.`);
        });
        test('renews the lock.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { token } } = (await priorityQueueStore.lockNext());
            await sleep_1.sleep({ ms: expirationTime * 0.75 });
            await priorityQueueStore.renewLock({
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                token
            });
            await sleep_1.sleep({ ms: expirationTime * 0.75 });
            const nextCommand = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(nextCommand).is.undefined();
        });
    });
    suite('acknowledge', () => {
        test('throws an error if the given item is not enqueued.', async () => {
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.acknowledge({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'non-existent'
                });
            }).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code &&
                ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}' not found.`);
        });
        test('throws an error if the given item is not in a locked queue.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.acknowledge({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'non-existent'
                });
            }).is.throwingAsync((ex) => ex.code === errors.ItemNotLocked.code &&
                ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}' not locked.`);
        });
        test('throws an error if the given token does not match.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.lockNext();
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.acknowledge({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'wrong-token'
                });
            }).is.throwingAsync((ex) => ex.code === errors.TokenMismatch.code &&
                ex.message === `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}'.`);
        });
        test('acknowledges the item.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.secondCommand,
                discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.secondCommand.metadata.timestamp
            });
            const { metadata: { token } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                token
            });
            const { item: nextCommand } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(nextCommand).is.equalTo(commands.firstAggregate.secondCommand);
        });
        test('acknowledges the last item in a queue and removes it.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { token } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                token
            });
            const shouldBeUndefined = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(shouldBeUndefined).is.undefined();
        });
        test('acknowledges items in a different order than they were locked.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'foo',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'bar',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { discriminator: discriminatorOne, token: tokenOne } } = (await priorityQueueStore.lockNext());
            const { metadata: { discriminator: discriminatorTwo, token: tokenTwo } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: discriminatorTwo,
                token: tokenTwo
            });
            await priorityQueueStore.acknowledge({
                discriminator: discriminatorOne,
                token: tokenOne
            });
        });
        test('can queue, lock and acknowledge multiple times after each other.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'foo',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { token: tokenOne } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: 'foo',
                token: tokenOne
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'foo',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { token: tokenTwo } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: 'foo',
                token: tokenTwo
            });
        });
        test('can queue, lock and acknowledge across multiple discriminators.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'foo',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'bar',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { discriminator: discriminatorOne, token: tokenOne } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: discriminatorOne,
                token: tokenOne
            });
            assertthat_1.assert.that(await priorityQueueStore.lockNext()).is.not.undefined();
        });
        test('can queue, lock and acknowledge across three discriminators multiple times after each other.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'foo',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'bar',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: 'baz',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { discriminator: discriminatorOne, token: tokenOne } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: discriminatorOne,
                token: tokenOne
            });
            const { metadata: { discriminator: discriminatorTwo, token: tokenTwo } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: discriminatorTwo,
                token: tokenTwo
            });
            const { metadata: { discriminator: discriminatorThree, token: tokenThree } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: discriminatorThree,
                token: tokenThree
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.secondCommand,
                discriminator: 'foo',
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            const { metadata: { discriminator: discriminatorFour, token: tokenFour } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.acknowledge({
                discriminator: discriminatorFour,
                token: tokenFour
            });
        });
    });
    suite('defer', () => {
        test('throws an error if the given item is not enqueued.', async () => {
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.defer({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'non-existent',
                    priority: commands.firstAggregate.firstCommand.metadata.timestamp
                });
            }).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code &&
                ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}' not found.`);
        });
        test('throws an error if the given item is not in a locked queue.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.defer({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'non-existent',
                    priority: commands.firstAggregate.firstCommand.metadata.timestamp
                });
            }).is.throwingAsync((ex) => ex.code === errors.ItemNotLocked.code &&
                ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}' not locked.`);
        });
        test('throws an error if the given token does not match.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.lockNext();
            await assertthat_1.assert.that(async () => {
                await priorityQueueStore.defer({
                    discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                    token: 'wrong-token',
                    priority: commands.firstAggregate.firstCommand.metadata.timestamp
                });
            }).is.throwingAsync((ex) => ex.code === errors.TokenMismatch.code &&
                ex.message === `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id}'.`);
        });
        test('defers the item.', async () => {
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.firstCommand,
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp
            });
            await priorityQueueStore.enqueue({
                item: commands.firstAggregate.secondCommand,
                discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.aggregate.id,
                priority: commands.firstAggregate.secondCommand.metadata.timestamp
            });
            const { metadata: { token } } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.defer({
                discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.aggregate.id,
                token,
                priority: commands.firstAggregate.firstCommand.metadata.timestamp + 1
            });
            const { item: nextCommand, metadata: { token: nextToken } } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(nextCommand).is.equalTo(commands.firstAggregate.secondCommand);
            await priorityQueueStore.acknowledge({
                discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.aggregate.id,
                token: nextToken
            });
            const { item: commandAfterNextCommand } = (await priorityQueueStore.lockNext());
            assertthat_1.assert.that(commandAfterNextCommand).is.equalTo(commands.firstAggregate.firstCommand);
        });
    });
    suite('remove', () => {
        test('throws an error if no queue exists for the discriminator.', async () => {
            await assertthat_1.assert.that(async () => await priorityQueueStore.remove({
                discriminator: uuid_1.v4(),
                itemIdentifier: { id: uuid_1.v4() }
            })).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code);
        });
        test('throws an error if no item in the queue matches the identifier.', async () => {
            const discriminator = uuid_1.v4();
            await priorityQueueStore.enqueue({ item: { id: uuid_1.v4() }, discriminator, priority: 5 });
            await assertthat_1.assert.that(async () => await priorityQueueStore.remove({
                discriminator,
                itemIdentifier: { id: uuid_1.v4() }
            })).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code);
        });
        test('throws an error if the item is in the front of the queue and currently locked.', async () => {
            const discriminator = uuid_1.v4();
            const item = { id: uuid_1.v4() };
            await priorityQueueStore.enqueue({ item, discriminator, priority: 5 });
            await priorityQueueStore.lockNext();
            await assertthat_1.assert.that(async () => await priorityQueueStore.remove({
                discriminator,
                itemIdentifier: item
            })).is.throwingAsync((ex) => ex.code === errors.ItemNotFound.code);
        });
        test('removes the item from the front of the queue and repairs up if necessary.', async () => {
            const discriminatorOne = uuid_1.v4();
            const discriminatorTwo = uuid_1.v4();
            const itemPrioOne = { id: uuid_1.v4() };
            const itemPrioTwo = { id: uuid_1.v4() };
            const itemPrioThree = { id: uuid_1.v4() };
            await priorityQueueStore.enqueue({ item: itemPrioThree, discriminator: discriminatorOne, priority: 3 });
            await priorityQueueStore.enqueue({ item: itemPrioOne, discriminator: discriminatorOne, priority: 1 });
            await priorityQueueStore.enqueue({ item: itemPrioTwo, discriminator: discriminatorTwo, priority: 2 });
            await priorityQueueStore.remove({ discriminator: discriminatorOne, itemIdentifier: itemPrioThree });
            const shouldBeItemPrioOne = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(shouldBeItemPrioOne === null || shouldBeItemPrioOne === void 0 ? void 0 : shouldBeItemPrioOne.item).is.equalTo(itemPrioOne);
        });
        test('removes the item from the front of the queue and repairs down if necessary.', async () => {
            const discriminatorOne = uuid_1.v4();
            const discriminatorTwo = uuid_1.v4();
            const itemPrioOne = { id: uuid_1.v4() };
            const itemPrioTwo = { id: uuid_1.v4() };
            const itemPrioThree = { id: uuid_1.v4() };
            await priorityQueueStore.enqueue({ item: itemPrioOne, discriminator: discriminatorOne, priority: 1 });
            await priorityQueueStore.enqueue({ item: itemPrioThree, discriminator: discriminatorOne, priority: 3 });
            await priorityQueueStore.enqueue({ item: itemPrioTwo, discriminator: discriminatorTwo, priority: 2 });
            await priorityQueueStore.remove({ discriminator: discriminatorOne, itemIdentifier: itemPrioOne });
            const shouldBeItemPrioTwo = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(shouldBeItemPrioTwo === null || shouldBeItemPrioTwo === void 0 ? void 0 : shouldBeItemPrioTwo.item).is.equalTo(itemPrioTwo);
        });
        test('removes the item from anywhere else in the queue.', async () => {
            const discriminator = uuid_1.v4();
            const itemPrioOne = { id: uuid_1.v4() };
            const itemPrioTwo = { id: uuid_1.v4() };
            await priorityQueueStore.enqueue({ item: itemPrioOne, discriminator, priority: 1 });
            await priorityQueueStore.enqueue({ item: itemPrioTwo, discriminator, priority: 2 });
            await priorityQueueStore.remove({ discriminator, itemIdentifier: itemPrioTwo });
            const shouldBeItemPrioOne = await priorityQueueStore.lockNext();
            await priorityQueueStore.acknowledge({ discriminator, token: shouldBeItemPrioOne.metadata.token });
            const shouldBeUndefined = await priorityQueueStore.lockNext();
            assertthat_1.assert.that(shouldBeUndefined).is.undefined();
        });
    });
    suite('regression tests', () => {
        test('lock, enqueue, acknowledge does not mess up the indexes.', async () => {
            await priorityQueueStore.enqueue({
                discriminator: 'foo',
                priority: Math.floor(Math.random() * 1000),
                item: { id: uuid_1.v4() }
            });
            const { metadata } = (await priorityQueueStore.lockNext());
            await priorityQueueStore.enqueue({
                discriminator: `bar`,
                priority: Math.floor(Math.random() * 1000),
                item: { id: uuid_1.v4() }
            });
            await priorityQueueStore.acknowledge({ discriminator: metadata.discriminator, token: metadata.token });
            await priorityQueueStore.enqueue({
                discriminator: `baz`,
                priority: Math.floor(Math.random() * 1000),
                item: { index: 0 }
            });
        });
        test('can handle large amounts of random items in queues.', async function () {
            this.timeout(40000);
            const enqueues = [];
            for (let i = 0; i < 150; i++) {
                enqueues.push({
                    discriminator: `${Math.floor(Math.random() * 5)}`,
                    priority: Math.floor(Math.random() * 1000),
                    item: { id: uuid_1.v4() }
                });
            }
            for (const enqueue of enqueues) {
                await priorityQueueStore.enqueue(enqueue);
            }
            const parallelism = 5;
            const counter = wait_for_signals_1.waitForSignals({ count: parallelism });
            for (let i = 0; i < parallelism; i++) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/no-loop-func
                p_forever_1.default(async () => {
                    try {
                        const nextLock = await priorityQueueStore.lockNext();
                        if (!nextLock) {
                            await counter.signal();
                            return p_forever_1.default.end;
                        }
                        await sleep_1.sleep({ ms: Math.floor(Math.random() * 150) });
                        await priorityQueueStore.acknowledge({
                            discriminator: nextLock.metadata.discriminator,
                            token: nextLock.metadata.token
                        });
                    }
                    catch (ex) {
                        await counter.fail(ex);
                    }
                });
            }
            await counter.promise;
        });
    });
};
exports.getTestsFor = getTestsFor;
//# sourceMappingURL=getTestsFor.js.map