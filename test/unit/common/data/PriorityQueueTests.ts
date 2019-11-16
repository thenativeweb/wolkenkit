import { assert } from 'assertthat';
import { PriorityQueue } from '../../../../lib/common/data/PriorityQueue';

suite('PriorityQueue', (): void => {
  let priorityQueue: PriorityQueue<number>;

  setup(async (): Promise<void> => {
    priorityQueue = new PriorityQueue<number>({
      getPriority: (item): number => item
    });
  });

  suite('isEmpty', (): void => {
    test('returns true for a new instance.', async (): Promise<void> => {
      assert.that(await priorityQueue.isEmpty()).is.true();
    });

    test('returns false if items have been enqueued.', async (): Promise<void> => {
      await priorityQueue.enqueue({ item: 23 });

      assert.that(await priorityQueue.isEmpty()).is.false();
    });

    test('returns true if all items have been dequeued.', async (): Promise<void> => {
      await priorityQueue.enqueue({ item: 23 });
      await priorityQueue.dequeue({ item: 23 });

      assert.that(await priorityQueue.isEmpty()).is.true();
    });
  });

  suite('getNextItem', (): void => {
    test('returns undefined if there is no next item.', async (): Promise<void> => {
      assert.that(await priorityQueue.getNextItem()).is.undefined();
    });

    test('returns the root item if there are items.', async (): Promise<void> => {
      await priorityQueue.enqueue({ item: 23 });

      assert.that(await priorityQueue.getNextItem()).is.equalTo(23);
    });
  });

  suite('values', (): void => {
    test('returns an empty array if no items have been enqueued.', async (): Promise<void> => {
      assert.that(await priorityQueue.values()).is.equalTo([]);
    });

    test('returns the heap array if items have been enqueued.', async (): Promise<void> => {
      await priorityQueue.enqueue({ item: 23 });

      assert.that(await priorityQueue.values()).is.equalTo([ 23 ]);
    });
  });

  suite('enqueue', (): void => {
    test('enqueues the first item as root.', async (): Promise<void> => {
      await priorityQueue.enqueue({ item: 23 });

      assert.that(await priorityQueue.values()).is.equalTo([ 23 ]);
    });

    test('enqueues with respect to the heap structure.', async (): Promise<void> => {
      await priorityQueue.enqueue({ item: 23 });
      await priorityQueue.enqueue({ item: 42 });
      await priorityQueue.enqueue({ item: 7 });
      await priorityQueue.enqueue({ item: 5 });
      await priorityQueue.enqueue({ item: 12 });

      assert.that(await priorityQueue.values()).is.equalTo([ 5, 7, 23, 42, 12 ]);
    });
  });

  suite('dequeue', (): void => {
    test('dequeues the root item if there is only one item.', async (): Promise<void> => {
      await priorityQueue.enqueue({ item: 23 });
      await priorityQueue.dequeue({ item: 23 });

      assert.that(await priorityQueue.values()).is.equalTo([]);
    });

    test('dequeues with respect to the heap structure.', async (): Promise<void> => {
      await priorityQueue.enqueue({ item: 23 });
      await priorityQueue.enqueue({ item: 42 });
      await priorityQueue.enqueue({ item: 7 });
      await priorityQueue.enqueue({ item: 5 });
      await priorityQueue.enqueue({ item: 12 });

      await priorityQueue.dequeue({ item: 23 });
      assert.that(await priorityQueue.values()).is.equalTo([ 5, 7, 12, 42 ]);

      await priorityQueue.dequeue({ item: 42 });
      assert.that(await priorityQueue.values()).is.equalTo([ 5, 7, 12 ]);

      await priorityQueue.dequeue({ item: 7 });
      assert.that(await priorityQueue.values()).is.equalTo([ 5, 12 ]);

      await priorityQueue.dequeue({ item: 5 });
      assert.that(await priorityQueue.values()).is.equalTo([ 12 ]);

      await priorityQueue.dequeue({ item: 12 });
      assert.that(await priorityQueue.values()).is.equalTo([]);
    });
  });

  suite('rebalance', (): void => {
    let itemToRebalance: { value: number; priority: number },
        priorityQueueComplex: PriorityQueue<{ value: number; priority: number }>;

    setup(async (): Promise<void> => {
      priorityQueueComplex = new PriorityQueue<{ value: number; priority: number }>({
        getPriority: (item): number => item.priority
      });

      itemToRebalance = { value: 7, priority: 7 };

      await priorityQueueComplex.enqueue({ item: { value: 23, priority: 23 }});
      await priorityQueueComplex.enqueue({ item: { value: 42, priority: 42 }});
      await priorityQueueComplex.enqueue({ item: itemToRebalance });
      await priorityQueueComplex.enqueue({ item: { value: 5, priority: 5 }});
      await priorityQueueComplex.enqueue({ item: { value: 12, priority: 12 }});
    });

    test('rebalances the heap structure if a priority becomes smaller.', async (): Promise<void> => {
      itemToRebalance.priority = 1;
      await priorityQueueComplex.rebalance({ item: itemToRebalance });

      assert.that(
        (await priorityQueueComplex.values()).map((item): number => item!.value)
      ).is.equalTo([ 7, 5, 23, 42, 12 ]);
    });

    test('rebalances the heap structure if a priority becomes larger.', async (): Promise<void> => {
      itemToRebalance.priority = 99;
      await priorityQueueComplex.rebalance({ item: itemToRebalance });

      assert.that(
        (await priorityQueueComplex.values()).map((item): number => item!.value)
      ).is.equalTo([ 5, 12, 23, 42, 7 ]);
    });

    test('rebalances the heap structure if the priority of the root item becomes smaller.', async (): Promise<void> => {
      const rootItem = await priorityQueueComplex.getNextItem();

      rootItem!.priority = 1;
      await priorityQueueComplex.rebalance({ item: rootItem! });

      assert.that(
        (await priorityQueueComplex.values()).map((item): number => item!.value)
      ).is.equalTo([ 5, 7, 23, 42, 12 ]);
    });

    test('rebalances the heap structure if the priority of the root item becomes larger.', async (): Promise<void> => {
      const rootItem = await priorityQueueComplex.getNextItem();

      rootItem!.priority = 99;
      await priorityQueueComplex.rebalance({ item: rootItem! });

      assert.that(
        (await priorityQueueComplex.values()).map((item): number => item!.value)
      ).is.equalTo([ 7, 12, 23, 42, 5 ]);
    });
  });
});
