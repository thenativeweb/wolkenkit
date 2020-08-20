import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../../lib/common/utils/test/buildCommandWithMetadata';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { getShortId } from '../../../shared/getShortId';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { sleep } from '../../../../lib/common/utils/sleep';
import { v4 } from 'uuid';

/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createPriorityQueueStore }: {
  createPriorityQueueStore ({ suffix, expirationTime }: {
    suffix: string;
    expirationTime: number;
  }): Promise<PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>>;
}): void {
  const expirationTime = 250;

  const firstAggregateId = v4(),
        secondAggregateId = v4();

  const commands = {
    firstAggregate: {
      firstCommand: buildCommandWithMetadata({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: firstAggregateId },
        name: 'execute',
        data: { strategy: 'succeed' },
        metadata: { timestamp: Date.now() + 0 }
      }),
      secondCommand: buildCommandWithMetadata({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: firstAggregateId },
        name: 'execute',
        data: { strategy: 'succeed' },
        metadata: { timestamp: Date.now() + 1 }
      })
    },
    secondAggregate: {
      firstCommand: buildCommandWithMetadata({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: secondAggregateId },
        name: 'execute',
        data: { strategy: 'succeed' },
        metadata: { timestamp: Date.now() + 2 }
      }),
      secondCommand: buildCommandWithMetadata({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: secondAggregateId },
        name: 'execute',
        data: { strategy: 'succeed' },
        metadata: { timestamp: Date.now() + 3 }
      })
    }
  };

  let priorityQueueStore: PriorityQueueStore<any, any>,
      suffix: string;

  setup(async (): Promise<void> => {
    suffix = getShortId();
    priorityQueueStore = await createPriorityQueueStore({ suffix, expirationTime });
    await priorityQueueStore.setup();
  });

  teardown(async function (): Promise<void> {
    this.timeout(20 * 1000);

    await priorityQueueStore.destroy();
  });

  suite('enqueue', (): void => {
    test('enqueues the given command.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { item: nextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(nextCommand).is.equalTo(commands.firstAggregate.firstCommand);
    });

    test('enqueues the same command twice if told so.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp
        });
      }).is.not.throwingAsync();
    });

    test('enqueues multiple commands for the same aggregate.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.secondCommand,
          discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.secondCommand.metadata.timestamp
        });
      }).is.not.throwingAsync();
    });

    test('enqueues commands for multiple aggregates.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.enqueue({
          item: commands.secondAggregate.firstCommand,
          discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.secondAggregate.firstCommand.metadata.timestamp
        });
      }).is.not.throwingAsync();
    });

    test('enqueues commands with special characters in keys.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
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

  suite('lockNext', (): void => {
    test('returns undefined if there are no enqueued items.', async (): Promise<void> => {
      const nextCommand = await priorityQueueStore.lockNext();

      assert.that(nextCommand).is.undefined();
    });

    test('returns a previously enqueued item.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { item: nextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(nextCommand).is.equalTo(commands.firstAggregate.firstCommand);
    });

    test('returns the discriminator for the locked item.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: 'foo',
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { metadata: { discriminator }} = (await priorityQueueStore.lockNext())!;

      assert.that(discriminator).is.equalTo('foo');
    });

    test('returns undefined if the queue of the enqueued items is locked.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.secondCommand,
        discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.secondCommand.metadata.timestamp
      });

      await priorityQueueStore.lockNext();

      const nextCommand = await priorityQueueStore.lockNext();

      assert.that(nextCommand).is.undefined();
    });

    test('returns enqueued items for independent aggregates.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.enqueue({
        item: commands.secondAggregate.firstCommand,
        discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.secondAggregate.firstCommand.metadata.timestamp
      });

      const { item: firstNextCommand } = (await priorityQueueStore.lockNext())!;
      const { item: secondNextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextCommand).is.equalTo(commands.firstAggregate.firstCommand);
      assert.that(secondNextCommand).is.equalTo(commands.secondAggregate.firstCommand);
    });

    test('returns undefined if all queues of the enqueued items are locked.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.secondCommand,
        discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.secondCommand.metadata.timestamp
      });
      await priorityQueueStore.enqueue({
        item: commands.secondAggregate.firstCommand,
        discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.secondAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.enqueue({
        item: commands.secondAggregate.secondCommand,
        discriminator: commands.secondAggregate.secondCommand.aggregateIdentifier.id,
        priority: commands.secondAggregate.secondCommand.metadata.timestamp
      });

      await priorityQueueStore.lockNext();
      await priorityQueueStore.lockNext();

      const nextCommand = await priorityQueueStore.lockNext();

      assert.that(nextCommand).is.undefined();
    });

    test('returns a previously locked item if its lock has expired.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { item: firstNextCommand } = (await priorityQueueStore.lockNext())!;

      await sleep({ ms: expirationTime * 1.5 });

      const { item: secondNextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextCommand).is.equalTo(secondNextCommand);
    });

    test('returns different tokens for each queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.enqueue({
        item: commands.secondAggregate.firstCommand,
        discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.secondAggregate.firstCommand.metadata.timestamp
      });

      const { metadata: { token: firstNextToken }} = (await priorityQueueStore.lockNext())!;
      const { metadata: { token: secondNextToken }} = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextToken).is.not.equalTo(secondNextToken);
    });

    test('returns different tokens for a re-locked item whose lock had expired.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { metadata: { token: firstNextToken }} = (await priorityQueueStore.lockNext())!;

      await sleep({ ms: expirationTime * 1.5 });

      const { metadata: { token: secondNextToken }} = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextToken).is.not.equalTo(secondNextToken);
    });

    test(`returns an item if a locked queue's until timestamp is lower than all other priorities.`, async (): Promise<void> => {
      const item1 = { id: v4() },
            item2 = { id: v4() };

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

      assert.that(firstLockResult?.item).is.equalTo(item1);

      const secondLockResult = await priorityQueueStore.lockNext();

      assert.that(secondLockResult).is.not.undefined();
      assert.that(secondLockResult?.item).is.equalTo(item2);
    });
  });

  suite('renewLock', (): void => {
    test('throws an error if the given item is not enqueued.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.renewLock({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'non-existent'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.ItemNotFound.code &&
        ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not found.`);
    });

    test('throws an error if the given item is not in a locked queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.renewLock({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'non-existent'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.ItemNotLocked.code &&
        ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not locked.`);
    });

    test('throws an error if the given token does not match.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.lockNext();

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.renewLock({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'wrong-token'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.TokenMismatch.code &&
        ex.message === `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}'.`);
    });

    test('renews the lock.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { metadata: { token }} = (await priorityQueueStore.lockNext())!;

      await sleep({ ms: expirationTime * 0.75 });
      await priorityQueueStore.renewLock({
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        token
      });
      await sleep({ ms: expirationTime * 0.75 });

      const nextCommand = await priorityQueueStore.lockNext();

      assert.that(nextCommand).is.undefined();
    });
  });

  suite('acknowledge', (): void => {
    test('throws an error if the given item is not enqueued.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.acknowledge({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'non-existent'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.ItemNotFound.code &&
        ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not found.`);
    });

    test('throws an error if the given item is not in a locked queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.acknowledge({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'non-existent'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.ItemNotLocked.code &&
        ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not locked.`);
    });

    test('throws an error if the given token does not match.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.lockNext();

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.acknowledge({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'wrong-token'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.TokenMismatch.code &&
        ex.message === `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}'.`);
    });

    test('acknowledges the item.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.secondCommand,
        discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.secondCommand.metadata.timestamp
      });

      const { metadata: { token }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        token
      });

      const { item: nextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(nextCommand).is.equalTo(commands.firstAggregate.secondCommand);
    });

    test('acknowledges the last item in a queue and removes it.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { metadata: { token }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        token
      });

      const shouldBeUndefined = (await priorityQueueStore.lockNext())!;

      assert.that(shouldBeUndefined).is.undefined();
    });

    test('acknowledges items in a different order than they were locked.', async (): Promise<void> => {
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

      const { metadata: { discriminator: discriminatorOne, token: tokenOne }} = (await priorityQueueStore.lockNext())!;
      const { metadata: { discriminator: discriminatorTwo, token: tokenTwo }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: discriminatorTwo,
        token: tokenTwo
      });

      await priorityQueueStore.acknowledge({
        discriminator: discriminatorOne,
        token: tokenOne
      });
    });

    test('can queue, lock and acknowledge multiple times after each other.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: 'foo',
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { metadata: { token: tokenOne }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: 'foo',
        token: tokenOne
      });

      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: 'foo',
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { metadata: { token: tokenTwo }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: 'foo',
        token: tokenTwo
      });
    });

    test('can queue, lock and acknowledge across multiple discriminators.', async (): Promise<void> => {
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

      const { metadata: { discriminator: discriminatorOne, token: tokenOne }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: discriminatorOne,
        token: tokenOne
      });

      assert.that(await priorityQueueStore.lockNext()).is.not.undefined();
    });

    test('can queue, lock and acknowledge across three discriminators multiple times after each other.', async (): Promise<void> => {
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

      const { metadata: { discriminator: discriminatorOne, token: tokenOne }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: discriminatorOne,
        token: tokenOne
      });

      const { metadata: { discriminator: discriminatorTwo, token: tokenTwo }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: discriminatorTwo,
        token: tokenTwo
      });

      const { metadata: { discriminator: discriminatorThree, token: tokenThree }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: discriminatorThree,
        token: tokenThree
      });

      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.secondCommand,
        discriminator: 'foo',
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { metadata: { discriminator: discriminatorFour, token: tokenFour }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: discriminatorFour,
        token: tokenFour
      });
    });
  });

  suite('defer', (): void => {
    test('throws an error if the given item is not enqueued.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.defer({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'non-existent',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.ItemNotFound.code &&
        ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not found.`);
    });

    test('throws an error if the given item is not in a locked queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.defer({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'non-existent',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.ItemNotLocked.code &&
        ex.message === `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not locked.`);
    });

    test('throws an error if the given token does not match.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.lockNext();

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.defer({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token: 'wrong-token',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === errors.TokenMismatch.code &&
        ex.message === `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}'.`);
    });

    test('defers the item.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.secondCommand,
        discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.secondCommand.metadata.timestamp
      });

      const { metadata: { token }} = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.defer({
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        token,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp + 1
      });

      const { item: nextCommand, metadata: { token: nextToken }} = (await priorityQueueStore.lockNext())!;

      assert.that(nextCommand).is.equalTo(commands.firstAggregate.secondCommand);

      await priorityQueueStore.acknowledge({
        discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
        token: nextToken
      });

      const { item: commandAfterNextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(commandAfterNextCommand).is.equalTo(commands.firstAggregate.firstCommand);
    });
  });

  suite('remove', (): void => {
    test('throws an error if no queue exists for the discriminator.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => await priorityQueueStore.remove({
        discriminator: v4(),
        itemIdentifier: { id: v4() }
      })).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.ItemNotFound.code);
    });

    test('throws an error if no item in the queue matches the identifier.', async (): Promise<void> => {
      const discriminator = v4();

      await priorityQueueStore.enqueue({ item: { id: v4() }, discriminator, priority: 5 });

      await assert.that(async (): Promise<void> => await priorityQueueStore.remove({
        discriminator,
        itemIdentifier: { id: v4() }
      })).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.ItemNotFound.code);
    });

    test('throws an error if the item is in the front of the queue and currently locked.', async (): Promise<void> => {
      const discriminator = v4();
      const item = { id: v4() };

      await priorityQueueStore.enqueue({ item, discriminator, priority: 5 });
      await priorityQueueStore.lockNext();

      await assert.that(async (): Promise<void> => await priorityQueueStore.remove({
        discriminator,
        itemIdentifier: item
      })).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.ItemNotFound.code);
    });

    test('removes the item from the front of the queue and repairs up if necessary.', async (): Promise<void> => {
      const discriminatorOne = v4();
      const discriminatorTwo = v4();

      const itemPrioOne = { id: v4() };
      const itemPrioTwo = { id: v4() };
      const itemPrioThree = { id: v4() };

      await priorityQueueStore.enqueue({ item: itemPrioThree, discriminator: discriminatorOne, priority: 3 });
      await priorityQueueStore.enqueue({ item: itemPrioOne, discriminator: discriminatorOne, priority: 1 });
      await priorityQueueStore.enqueue({ item: itemPrioTwo, discriminator: discriminatorTwo, priority: 2 });

      await priorityQueueStore.remove({ discriminator: discriminatorOne, itemIdentifier: itemPrioThree });

      const shouldBeItemPrioOne = await priorityQueueStore.lockNext();

      assert.that(shouldBeItemPrioOne?.item).is.equalTo(itemPrioOne);
    });

    test('removes the item from the front of the queue and repairs down if necessary.', async (): Promise<void> => {
      const discriminatorOne = v4();
      const discriminatorTwo = v4();

      const itemPrioOne = { id: v4() };
      const itemPrioTwo = { id: v4() };
      const itemPrioThree = { id: v4() };

      await priorityQueueStore.enqueue({ item: itemPrioOne, discriminator: discriminatorOne, priority: 1 });
      await priorityQueueStore.enqueue({ item: itemPrioThree, discriminator: discriminatorOne, priority: 3 });
      await priorityQueueStore.enqueue({ item: itemPrioTwo, discriminator: discriminatorTwo, priority: 2 });

      await priorityQueueStore.remove({ discriminator: discriminatorOne, itemIdentifier: itemPrioOne });

      const shouldBeItemPrioTwo = await priorityQueueStore.lockNext();

      assert.that(shouldBeItemPrioTwo?.item).is.equalTo(itemPrioTwo);
    });

    test('removes the item from anywhere else in the queue.', async (): Promise<void> => {
      const discriminator = v4();

      const itemPrioOne = { id: v4() };
      const itemPrioTwo = { id: v4() };

      await priorityQueueStore.enqueue({ item: itemPrioOne, discriminator, priority: 1 });
      await priorityQueueStore.enqueue({ item: itemPrioTwo, discriminator, priority: 2 });

      await priorityQueueStore.remove({ discriminator, itemIdentifier: itemPrioTwo });
      const shouldBeItemPrioOne = await priorityQueueStore.lockNext();

      await priorityQueueStore.acknowledge({ discriminator, token: shouldBeItemPrioOne!.metadata.token });
      const shouldBeUndefined = await priorityQueueStore.lockNext();

      assert.that(shouldBeUndefined).is.undefined();
    });
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
