import { errors } from '../../errors';
import { FindPredicate } from './FindPredicate';
import { GetPriority } from './GetPriority';
import PQueue from 'p-queue';

// The priority queue implemented by this class is based on a heap data
// structure, where items with smaller values tend to become closer to the root
// node. Hence, it's a min-heap here.
class PriorityQueue<TItem> {
  protected items: (TItem | undefined)[];

  protected index: Map<TItem, number>;

  protected getPriority: GetPriority<TItem>;

  protected functionCallQueue: PQueue;

  protected static getIndexOfLeftChild ({ index }: { index: number }): number {
    return (2 * index) + 1;
  }

  protected static getIndexOfRightChild ({ index }: { index: number }): number {
    return (2 * index) + 2;
  }

  protected static getIndexOfParent ({ index }: { index: number }): number {
    const isLeftChild = index % 2 === 1;

    if (isLeftChild) {
      return (index - 1) / 2;
    }

    return (index - 2) / 2;
  }

  public constructor ({ getPriority }: {
    getPriority: GetPriority<TItem>;
  }) {
    this.items = [];
    this.index = new Map<TItem, number>();
    this.getPriority = getPriority;
    this.functionCallQueue = new PQueue({ concurrency: 1 });
  }

  protected repairUp ({ item }: { item: TItem }): void {
    const index = this.index.get(item);

    if (index === undefined) {
      throw new errors.InvalidOperation();
    }
    if (index === 0) {
      return;
    }

    const parentIndex = PriorityQueue.getIndexOfParent({ index });
    const parentItem = this.items[parentIndex];

    const itemPriority = this.getPriority(item);
    const parentPriority = this.getPriority(parentItem!);

    if (parentPriority <= itemPriority) {
      return;
    }

    this.items[parentIndex] = item;
    this.items[index] = parentItem;
    this.index.set(item, parentIndex);
    this.index.set(parentItem!, index);

    this.repairUp({ item });
  }

  protected repairDown ({ item }: { item: TItem }): void {
    const index = this.index.get(item);

    if (index === undefined) {
      throw new errors.InvalidOperation();
    }

    const leftChildIndex = PriorityQueue.getIndexOfLeftChild({ index });
    const rightChildIndex = PriorityQueue.getIndexOfRightChild({ index });

    if (leftChildIndex >= this.items.length) {
      return;
    }

    const leftChildItem = this.items[leftChildIndex];
    const rightChildItem = this.items[rightChildIndex];

    const itemPriority = this.getPriority(item);

    const leftChildItemPriority = this.getPriority(leftChildItem!);
    const rightChildItemPriority = rightChildItem ?
      this.getPriority(rightChildItem) :
      Number.MAX_SAFE_INTEGER;

    if (
      itemPriority <= leftChildItemPriority &&
      itemPriority <= rightChildItemPriority
    ) {
      return;
    }

    if (leftChildItemPriority <= rightChildItemPriority) {
      this.items[leftChildIndex] = item;
      this.items[index] = leftChildItem;
      this.index.set(item, leftChildIndex);
      this.index.set(leftChildItem!, index);

      this.repairDown({ item });
    } else {
      this.items[rightChildIndex] = item;
      this.items[index] = rightChildItem;
      this.index.set(item, rightChildIndex);
      this.index.set(rightChildItem!, index);

      this.repairDown({ item });
    }
  }

  protected async isEmptyInternal (): Promise<boolean> {
    return this.items.length === 0;
  }

  protected async getNextItemInternal (): Promise<TItem | undefined> {
    return this.items[0];
  }

  protected async valuesInternal (): Promise<(TItem | undefined)[]> {
    return this.items;
  }

  protected async findInternal (predicate: FindPredicate<TItem>): Promise<TItem | undefined> {
    return this.items.find((element): boolean => {
      if (element === undefined) {
        return false;
      }

      return predicate(element);
    });
  }

  protected async enqueueInternal ({ item }: { item: TItem }): Promise<void> {
    if (this.index.get(item) !== undefined) {
      return;
    }

    const enqueueIndex = this.items.length;

    this.items[enqueueIndex] = item;
    this.index.set(item, enqueueIndex);

    this.repairUp({ item });
  }

  protected async removeInternal ({ item }: { item: TItem }): Promise<void> {
    const index = this.index.get(item);

    if (index === undefined) {
      return;
    }

    const lastItem = this.items.pop();

    this.index.delete(item);

    if (index >= this.items.length) {
      return;
    }

    this.items[index] = lastItem;
    this.index.set(lastItem!, index);

    this.repairDown({ item: lastItem! });
  }

  protected async dequeueInternal (): Promise<TItem | undefined> {
    const nextItem = await this.getNextItemInternal();

    if (!nextItem) {
      return;
    }

    await this.removeInternal({ item: nextItem });

    return nextItem;
  }

  protected async repairInternal ({ item }: { item: TItem }): Promise<void> {
    const index = this.index.get(item);

    if (index === undefined) {
      return;
    }

    // Run both, repairUp and repairDown. One of them may take action. Instead
    // of trying to detect which one to call, simply call both, and one of them
    // will do its job if necessary.
    this.repairUp({ item });
    this.repairDown({ item });
  }

  public async isEmpty (): Promise<boolean> {
    return await this.functionCallQueue.add(
      async (): Promise<boolean> => this.isEmptyInternal()
    );
  }

  public async getNextItem (): Promise<TItem | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<TItem | undefined> => this.getNextItemInternal()
    );
  }

  public async values (): Promise<(TItem | undefined)[]> {
    return await this.functionCallQueue.add(
      async (): Promise<(TItem | undefined)[]> => this.valuesInternal()
    );
  }

  public async find (predicate: FindPredicate<TItem>): Promise<TItem | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<TItem | undefined> => this.findInternal(predicate)
    );
  }

  public async enqueue ({ item }: { item: TItem }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.enqueueInternal({ item })
    );
  }

  public async remove ({ item }: { item: TItem }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.removeInternal({ item })
    );
  }

  public async dequeue (): Promise<TItem | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<TItem | undefined> => this.dequeueInternal()
    );
  }

  public async repair ({ item }: { item: TItem }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.repairInternal({ item })
    );
  }
}

export { PriorityQueue };
