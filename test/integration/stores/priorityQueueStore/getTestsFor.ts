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
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      const { item: nextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(nextCommand).is.equalTo(commands.firstAggregate.firstCommand);
    });

    test('throws an error if the given command has already been enqueued.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EITEMALREADYEXISTS' &&
        ex.message === `Item 'sampleContext.sampleAggregate.${commands.firstAggregate.firstCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.firstCommand.id}' already exists.`);
    });

    test('enqueues multiple commands for the same aggregate.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.enqueue({ item: commands.firstAggregate.secondCommand });
      }).is.not.throwingAsync();
    });

    test('enqueues commands for multiple aggregates.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.enqueue({ item: commands.secondAggregate.firstCommand });
      }).is.not.throwingAsync();
    });
  });

  suite('lockNext', (): void => {
    test('returns undefined if there are no enqueued items.', async (): Promise<void> => {
      const nextCommand = await priorityQueueStore.lockNext();

      assert.that(nextCommand).is.undefined();
    });

    test('returns a previously enqueued item.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      const { item: nextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(nextCommand).is.equalTo(commands.firstAggregate.firstCommand);
    });

    test('returns undefined if the queue of the enqueued items is locked.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.secondCommand });

      await priorityQueueStore.lockNext();

      const nextCommand = await priorityQueueStore.lockNext();

      assert.that(nextCommand).is.undefined();
    });

    test('returns enqueued items for independent aggregates.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.enqueue({ item: commands.secondAggregate.firstCommand });

      const { item: firstNextCommand } = (await priorityQueueStore.lockNext())!;
      const { item: secondNextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextCommand).is.equalTo(commands.firstAggregate.firstCommand);
      assert.that(secondNextCommand).is.equalTo(commands.secondAggregate.firstCommand);
    });

    test('returns undefined if all queues of the enqueued items are locked.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.secondCommand });
      await priorityQueueStore.enqueue({ item: commands.secondAggregate.firstCommand });
      await priorityQueueStore.enqueue({ item: commands.secondAggregate.secondCommand });

      await priorityQueueStore.lockNext();
      await priorityQueueStore.lockNext();

      const nextCommand = await priorityQueueStore.lockNext();

      assert.that(nextCommand).is.undefined();
    });

    test('returns a previously locked item if its lock has expired.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      const { item: firstNextCommand } = (await priorityQueueStore.lockNext())!;

      await sleep({ ms: expirationTime * 1.5 });

      const { item: secondNextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextCommand).is.equalTo(secondNextCommand);
    });

    test('returns different tokens for each queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.enqueue({ item: commands.secondAggregate.firstCommand });

      const { token: firstNextToken } = (await priorityQueueStore.lockNext())!;
      const { token: secondNextToken } = (await priorityQueueStore.lockNext())!;

      assert.that(firstNextToken).is.not.equalTo(secondNextToken);
    });

    test('returns different tokens for a re-locked item whose lock had expired.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

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
          itemIdentifier: commands.firstAggregate.firstCommand.getItemIdentifier(),
          token: 'non-existent'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EITEMNOTFOUND' &&
        ex.message === `Item 'sampleContext.sampleAggregate.${commands.firstAggregate.firstCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.firstCommand.id}' not found.`);
    });

    test('throws an error if the given item is not in a locked queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.renewLock({
          itemIdentifier: commands.firstAggregate.firstCommand.getItemIdentifier(),
          token: 'non-existent'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EITEMNOTLOCKED' &&
        ex.message === `Item 'sampleContext.sampleAggregate.${commands.firstAggregate.firstCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.firstCommand.id}' not locked.`);
    });

    test('throws an error if the given token does not match.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.lockNext();

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.renewLock({
          itemIdentifier: commands.firstAggregate.firstCommand.getItemIdentifier(),
          token: 'wrong-token'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'ETOKENMISMATCH' &&
        ex.message === `Token mismatch for item 'sampleContext.sampleAggregate.${commands.firstAggregate.firstCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.firstCommand.id}'.`);
    });

    test('throws an error if the given item is not the first in the locked queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.secondCommand });

      const { token } = (await priorityQueueStore.lockNext())!;

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.renewLock({
          itemIdentifier: commands.firstAggregate.secondCommand.getItemIdentifier(),
          token
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EITEMNOTFOUND' &&
        ex.message === `Item 'sampleContext.sampleAggregate.${commands.firstAggregate.secondCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.secondCommand.id}' not found.`);
    });

    test('renews the lock.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      const { token } = (await priorityQueueStore.lockNext())!;

      await sleep({ ms: expirationTime * 0.75 });
      await priorityQueueStore.renewLock({
        itemIdentifier: commands.firstAggregate.firstCommand.getItemIdentifier(),
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
          itemIdentifier: commands.firstAggregate.firstCommand.getItemIdentifier(),
          token: 'non-existent'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EITEMNOTFOUND' &&
        ex.message === `Item 'sampleContext.sampleAggregate.${commands.firstAggregate.firstCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.firstCommand.id}' not found.`);
    });

    test('throws an error if the given item is not in a locked queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.acknowledge({
          itemIdentifier: commands.firstAggregate.firstCommand.getItemIdentifier(),
          token: 'non-existent'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EITEMNOTLOCKED' &&
        ex.message === `Item 'sampleContext.sampleAggregate.${commands.firstAggregate.firstCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.firstCommand.id}' not locked.`);
    });

    test('throws an error if the given token does not match.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.lockNext();

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.acknowledge({
          itemIdentifier: commands.firstAggregate.firstCommand.getItemIdentifier(),
          token: 'wrong-token'
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'ETOKENMISMATCH' &&
        ex.message === `Token mismatch for item 'sampleContext.sampleAggregate.${commands.firstAggregate.firstCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.firstCommand.id}'.`);
    });

    test('throws an error if the given item is not the first in the locked queue.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.secondCommand });

      const { token } = (await priorityQueueStore.lockNext())!;

      await assert.that(async (): Promise<void> => {
        await priorityQueueStore.acknowledge({
          itemIdentifier: commands.firstAggregate.secondCommand.getItemIdentifier(),
          token
        });
      }).is.throwingAsync((ex): boolean =>
        (ex as CustomError).code === 'EITEMNOTFOUND' &&
        ex.message === `Item 'sampleContext.sampleAggregate.${commands.firstAggregate.secondCommand.aggregateIdentifier.id}.execute.${commands.firstAggregate.secondCommand.id}' not found.`);
    });

    test('acknowledges the item.', async (): Promise<void> => {
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.firstCommand });
      await priorityQueueStore.enqueue({ item: commands.firstAggregate.secondCommand });

      const { token } = (await priorityQueueStore.lockNext())!;

      await priorityQueueStore.acknowledge({
        itemIdentifier: commands.firstAggregate.firstCommand.getItemIdentifier(),
        token
      });

      const { item: nextCommand } = (await priorityQueueStore.lockNext())!;

      assert.that(nextCommand).is.equalTo(commands.firstAggregate.secondCommand);
    });
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
