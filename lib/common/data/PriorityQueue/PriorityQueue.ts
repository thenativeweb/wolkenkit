import { GetPriority } from './GetPriority';
import { IsEqual } from './IsEqual';
import PQueue from 'p-queue';

// The priority queue implemented by this class is based on a heap data
// structure, where items with smaller values tend to become closer to the root
// node. Hence, it's a min-heap here.
class PriorityQueue<TItem> {
  protected items: (TItem | undefined)[];

  protected getPriority: GetPriority<TItem>;

  protected isEqual: IsEqual<TItem>;

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

  public constructor ({
    getPriority,
    isEqual = (leftItem, rightItem): boolean => leftItem === rightItem
  }: {
    getPriority: GetPriority<TItem>;
    isEqual?: IsEqual<TItem>;
  }) {
    this.items = [];
    this.getPriority = getPriority;
    this.isEqual = isEqual;
    this.functionCallQueue = new PQueue({ concurrency: 1 });
  }

  protected getIndexOfItem ({ item }: { item: TItem }): number | undefined {
    for (const [ currentIndex, currentItem ] of this.items.entries()) {
      if (this.isEqual(item, currentItem!)) {
        return currentIndex;
      }
    }
  }

  protected repairUp ({ item, index }: { item: TItem; index: number }): void {
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

    this.repairUp({ item, index: parentIndex });
  }

  protected repairDown ({ item, index }: { item: TItem; index: number }): void {
    const leftChildIndex = PriorityQueue.getIndexOfLeftChild({ index });
    const rightChildIndex = PriorityQueue.getIndexOfRightChild({ index });

    if (leftChildIndex >= this.items.length) {
      return;
    }

    const leftChildItem = this.items[leftChildIndex];
    const rightChildItem = this.items[rightChildIndex];

    const itemPriority = this.getPriority(item);

    const leftChildItemPriority = leftChildItem ?
      this.getPriority(leftChildItem) :
      Number.MAX_SAFE_INTEGER;

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
      this.repairDown({ item, index: leftChildIndex });
    } else {
      this.items[rightChildIndex] = item;
      this.items[index] = rightChildItem;
      this.repairDown({ item, index: rightChildIndex });
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

  protected async enqueueInternal ({ item }: { item: TItem }): Promise<void> {
    const enqueueIndex = this.items.length;

    this.items[enqueueIndex] = item;
    this.repairUp({ item, index: enqueueIndex });
  }

  protected async removeInternal ({ item }: { item: TItem }): Promise<void> {
    const index = this.getIndexOfItem({ item });

    if (index === undefined) {
      return;
    }

    const lastItem = this.items.pop();

    if (index >= this.items.length) {
      return;
    }

    this.items[index] = lastItem;
    this.repairDown({ item: lastItem!, index });
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
    const index = this.getIndexOfItem({ item });

    if (index === undefined) {
      return;
    }

    // Run both, repairUp and repairDown. One of them may take action. Instead
    // of trying to detect which one to call, simply call both, and one of them
    // will do its job if necessary.
    this.repairUp({ item, index });
    this.repairDown({ item, index });
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
