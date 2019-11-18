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
      assert.that(priorityQueue.isEmpty()).is.true();
    });

    test('returns false if items have been enqueued.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });

      assert.that(priorityQueue.isEmpty()).is.false();
    });

    test('returns true if all items have been removed.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });
      priorityQueue.remove({ item: 23 });

      assert.that(priorityQueue.isEmpty()).is.true();
    });
  });

  suite('getNextItem', (): void => {
    test('returns undefined if there is no next item.', async (): Promise<void> => {
      assert.that(priorityQueue.getNextItem()).is.undefined();
    });

    test('returns the root item if there are items.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });

      assert.that(priorityQueue.getNextItem()).is.equalTo(23);
    });
  });

  suite('values', (): void => {
    test('returns an empty array if no items have been enqueued.', async (): Promise<void> => {
      assert.that(priorityQueue.values()).is.equalTo([]);
    });

    test('returns the heap array if items have been enqueued.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });

      assert.that(priorityQueue.values()).is.equalTo([ 23 ]);
    });
  });

  suite('enqueue', (): void => {
    test('enqueues the first item as root.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });

      assert.that(priorityQueue.values()).is.equalTo([ 23 ]);
    });

    test('enqueues with respect to the heap structure.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });
      priorityQueue.enqueue({ item: 42 });
      priorityQueue.enqueue({ item: 7 });
      priorityQueue.enqueue({ item: 5 });
      priorityQueue.enqueue({ item: 12 });

      assert.that(priorityQueue.values()).is.equalTo([ 5, 7, 23, 42, 12 ]);
    });
  });

  suite('remove', (): void => {
    test('removes the root item if there is only one item.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });
      priorityQueue.remove({ item: 23 });

      assert.that(priorityQueue.values()).is.equalTo([]);
    });

    test('removes with respect to the heap structure.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });
      priorityQueue.enqueue({ item: 42 });
      priorityQueue.enqueue({ item: 7 });
      priorityQueue.enqueue({ item: 5 });
      priorityQueue.enqueue({ item: 12 });

      priorityQueue.remove({ item: 23 });
      assert.that(priorityQueue.values()).is.equalTo([ 5, 7, 12, 42 ]);

      priorityQueue.remove({ item: 42 });
      assert.that(priorityQueue.values()).is.equalTo([ 5, 7, 12 ]);

      priorityQueue.remove({ item: 7 });
      assert.that(priorityQueue.values()).is.equalTo([ 5, 12 ]);

      priorityQueue.remove({ item: 5 });
      assert.that(priorityQueue.values()).is.equalTo([ 12 ]);

      priorityQueue.remove({ item: 12 });
      assert.that(priorityQueue.values()).is.equalTo([]);
    });
  });

  suite('dequeue', (): void => {
    test('returns undefined if there is no next item.', async (): Promise<void> => {
      assert.that(priorityQueue.dequeue()).is.undefined();
    });

    test('removes and returns the root item if there is only one item.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });

      const nextItem = priorityQueue.dequeue();

      assert.that(nextItem).is.equalTo(23);
      assert.that(priorityQueue.values()).is.equalTo([]);
    });

    test('removes and returns the next item if there are more items.', async (): Promise<void> => {
      priorityQueue.enqueue({ item: 23 });
      priorityQueue.enqueue({ item: 42 });
      priorityQueue.enqueue({ item: 7 });
      priorityQueue.enqueue({ item: 5 });
      priorityQueue.enqueue({ item: 12 });

      const nextItem = priorityQueue.dequeue();

      assert.that(nextItem).is.equalTo(5);
      assert.that(priorityQueue.values()).is.equalTo([ 7, 12, 23, 42 ]);
    });
  });

  suite('repair', (): void => {
    let itemToRepair: { value: number; priority: number },
        priorityQueueComplex: PriorityQueue<{ value: number; priority: number }>;

    setup(async (): Promise<void> => {
      priorityQueueComplex = new PriorityQueue<{ value: number; priority: number }>({
        getPriority: (item): number => item.priority
      });

      itemToRepair = { value: 7, priority: 7 };

      priorityQueueComplex.enqueue({ item: { value: 23, priority: 23 }});
      priorityQueueComplex.enqueue({ item: { value: 42, priority: 42 }});
      priorityQueueComplex.enqueue({ item: itemToRepair });
      priorityQueueComplex.enqueue({ item: { value: 5, priority: 5 }});
      priorityQueueComplex.enqueue({ item: { value: 12, priority: 12 }});
    });

    test('repairs the heap structure if a priority becomes smaller.', async (): Promise<void> => {
      itemToRepair.priority = 1;
      priorityQueueComplex.repair({ item: itemToRepair });

      assert.that(
        priorityQueueComplex.values().map((item): number => item!.value)
      ).is.equalTo([ 7, 5, 23, 42, 12 ]);
    });

    test('repairs the heap structure if a priority becomes larger.', async (): Promise<void> => {
      itemToRepair.priority = 99;
      priorityQueueComplex.repair({ item: itemToRepair });

      assert.that(
        priorityQueueComplex.values().map((item): number => item!.value)
      ).is.equalTo([ 5, 12, 23, 42, 7 ]);
    });

    test('repairs the heap structure if the priority of the root item becomes smaller.', async (): Promise<void> => {
      const rootItem = priorityQueueComplex.getNextItem();

      rootItem!.priority = 1;
      priorityQueueComplex.repair({ item: rootItem! });

      assert.that(
        priorityQueueComplex.values().map((item): number => item!.value)
      ).is.equalTo([ 5, 7, 23, 42, 12 ]);
    });

    test('repairs the heap structure if the priority of the root item becomes larger.', async (): Promise<void> => {
      const rootItem = priorityQueueComplex.getNextItem();

      rootItem!.priority = 99;
      priorityQueueComplex.repair({ item: rootItem! });

      assert.that(
        priorityQueueComplex.values().map((item): number => item!.value)
      ).is.equalTo([ 7, 12, 23, 42, 5 ]);
    });
  });
});
