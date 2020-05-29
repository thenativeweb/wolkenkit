import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../shared/buildCommandWithMetadata';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { sleep } from '../../../../lib/common/utils/sleep';
import { uuid } from 'uuidv4';

/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createPriorityQueueStore }: {
  createPriorityQueueStore ({ expirationTime }: {
    expirationTime: number;
  }): Promise<PriorityQueueStore<CommandWithMetadata<CommandData>>>;
}): void {
  const expirationTime = 100;

  const firstAggregateId = uuid(),
        secondAggregateId = uuid();

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

  let priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;

  setup(async (): Promise<void> => {
    priorityQueueStore = await createPriorityQueueStore({ expirationTime });
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

      const { token: firstNextToken } = (await priorityQueueStore.lockNext())!;
      const { token: secondNextToken } = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextToken).is.not.equalTo(secondNextToken);
    });

    test('returns different tokens for a re-locked item whose lock had expired.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { token: firstNextToken } = (await priorityQueueStore.lockNext())!;

      await sleep({ ms: expirationTime * 1.5 });

      const { token: secondNextToken } = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextToken).is.not.equalTo(secondNextToken);
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
        (ex as CustomError).code === 'EITEMNOTFOUND' &&
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
        (ex as CustomError).code === 'EITEMNOTLOCKED' &&
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
        (ex as CustomError).code === 'ETOKENMISMATCH' &&
        ex.message === `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}'.`);
    });

    test('renews the lock.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: commands.firstAggregate.firstCommand,
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        priority: commands.firstAggregate.firstCommand.metadata.timestamp
      });

      const { token } = (await priorityQueueStore.lockNext())!;

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
        (ex as CustomError).code === 'EITEMNOTFOUND' &&
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
        (ex as CustomError).code === 'EITEMNOTLOCKED' &&
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
        (ex as CustomError).code === 'ETOKENMISMATCH' &&
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

      const { token } = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
        token
      });

      const { item: nextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(nextCommand).is.equalTo(commands.firstAggregate.secondCommand);
    });
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
