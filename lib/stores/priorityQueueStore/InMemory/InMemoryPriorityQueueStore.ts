import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { CommandData } from '../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../common/elements/CommandWithMetadata';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { errors } from '../../../common/errors';
import { ItemIdentifier } from '../../../common/elements/ItemIdentifier';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { uuid } from 'uuidv4';

// The priority queue implemented by this class is based on a heap data
// structure, where items with smaller values tend to become closer to the root
// node. Hence, it's a min-heap here.
class InMemoryPriorityQueueStore<TItem extends CommandWithMetadata<CommandData> | DomainEvent<DomainEventData>> implements PriorityQueueStore<TItem> {
  protected expirationTime: number;

  protected queues: (Queue<TItem> | undefined)[];

  protected index: Map<string, number>;

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

  /* eslint-disable class-methods-use-this */
  protected getPriority ({ queue }: { queue: Queue<TItem> }): number {
    if (queue.lock) {
      return queue.lock.until;
    }

    return queue.items[0].metadata.timestamp;
  }
  /* eslint-enable class-methods-use-this */

  protected constructor ({ expirationTime }: {
    expirationTime: number;
  }) {
    this.expirationTime = expirationTime;
    this.queues = [];
    this.index = new Map();
    this.functionCallQueue = new PQueue({ concurrency: 1 });
  }

  public static async create<TItem extends CommandWithMetadata<CommandData> | DomainEvent<DomainEventData>> ({ expirationTime = 15_000 }: {
    expirationTime?: number;
  }): Promise<InMemoryPriorityQueueStore<TItem>> {
    return new InMemoryPriorityQueueStore<TItem>({ expirationTime });
  }

  protected repairUp ({ queue }: { queue: Queue<TItem> }): void {
    const index = this.index.get(queue.aggregateIdentifier.id);

    if (index === undefined) {
      throw new errors.InvalidOperation();
    }
    if (index === 0) {
      return;
    }

    const parentIndex = InMemoryPriorityQueueStore.getIndexOfParent({ index });
    const parentQueue = this.queues[parentIndex]!;

    const queuePriority = this.getPriority({ queue });
    const parentPriority = this.getPriority({ queue: parentQueue });

    if (parentPriority <= queuePriority) {
      return;
    }

    this.queues[parentIndex] = queue;
    this.queues[index] = parentQueue;
    this.index.set(queue.aggregateIdentifier.id, parentIndex);
    this.index.set(parentQueue.aggregateIdentifier.id, index);

    this.repairUp({ queue });
  }

  protected repairDown ({ queue }: { queue: Queue<TItem> }): void {
    const index = this.index.get(queue.aggregateIdentifier.id);

    if (index === undefined) {
      throw new errors.InvalidOperation();
    }

    const leftChildIndex = InMemoryPriorityQueueStore.getIndexOfLeftChild({ index });
    const rightChildIndex = InMemoryPriorityQueueStore.getIndexOfRightChild({ index });

    if (leftChildIndex >= this.queues.length) {
      return;
    }

    const leftChildQueue = this.queues[leftChildIndex]!;
    const rightChildQueue = this.queues[rightChildIndex];

    const queuePriority = this.getPriority({ queue });

    const leftChildQueuePriority = this.getPriority({ queue: leftChildQueue });
    const rightChildQueuePriority = rightChildQueue ?
      this.getPriority({ queue: rightChildQueue }) :
      Number.MAX_SAFE_INTEGER;

    if (
      queuePriority <= leftChildQueuePriority &&
      queuePriority <= rightChildQueuePriority
    ) {
      return;
    }

    if (leftChildQueuePriority <= rightChildQueuePriority) {
      this.queues[leftChildIndex] = queue;
      this.queues[index] = leftChildQueue;
      this.index.set(queue.aggregateIdentifier.id, leftChildIndex);
      this.index.set(leftChildQueue.aggregateIdentifier.id, index);

      this.repairDown({ queue });
    } else {
      this.queues[rightChildIndex] = queue;
      this.queues[index] = rightChildQueue;
      this.index.set(queue.aggregateIdentifier.id, rightChildIndex);
      this.index.set(rightChildQueue!.aggregateIdentifier.id, index);

      this.repairDown({ queue });
    }
  }

  protected removeInternal ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): void {
    const queueIndex = this.index.get(aggregateIdentifier.id);

    if (queueIndex === undefined) {
      throw new errors.InvalidOperation();
    }

    const lastQueue = this.queues.pop()!;

    this.index.delete(lastQueue.aggregateIdentifier.id);

    if (queueIndex >= this.queues.length) {
      return;
    }

    this.queues[queueIndex] = lastQueue;
    this.index.set(lastQueue.aggregateIdentifier.id, queueIndex);

    this.repairDown({ queue: lastQueue });
  }

  protected getQueueIfLocked ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): Queue<TItem> {
    const queueIndex = this.index.get(itemIdentifier.aggregateIdentifier.id);

    if (queueIndex === undefined) {
      throw new errors.ItemNotFound(`Item '${itemIdentifier.contextIdentifier.name}.${itemIdentifier.aggregateIdentifier.name}.${itemIdentifier.aggregateIdentifier.id}.${itemIdentifier.name}.${itemIdentifier.id}' not found.`);
    }

    const queue = this.queues[queueIndex]!;

    if (!queue.lock) {
      throw new errors.ItemNotLocked(`Item '${itemIdentifier.contextIdentifier.name}.${itemIdentifier.aggregateIdentifier.name}.${itemIdentifier.aggregateIdentifier.id}.${itemIdentifier.name}.${itemIdentifier.id}' not locked.`);
    }
    if (queue.lock.token !== token) {
      throw new errors.TokenMismatch(`Token mismatch for item '${itemIdentifier.contextIdentifier.name}.${itemIdentifier.aggregateIdentifier.name}.${itemIdentifier.aggregateIdentifier.id}.${itemIdentifier.name}.${itemIdentifier.id}'.`);
    }
    if (queue.items[0].id !== itemIdentifier.id) {
      throw new errors.ItemNotFound(`Item '${itemIdentifier.contextIdentifier.name}.${itemIdentifier.aggregateIdentifier.name}.${itemIdentifier.aggregateIdentifier.id}.${itemIdentifier.name}.${itemIdentifier.id}' not found.`);
    }

    return queue;
  }

  protected enqueueInternal ({ item }: { item: TItem }): void {
    const queueIndex = this.index.get(item.aggregateIdentifier.id) ?? this.queues.length;
    let queue = this.queues[queueIndex];

    if (!queue) {
      queue = {
        aggregateIdentifier: item.aggregateIdentifier,
        items: []
      };

      this.queues.push(queue);
      this.index.set(queue.aggregateIdentifier.id, queueIndex);
    }

    if (queue.items.find((queueItem): boolean => queueItem.id === item.id)) {
      throw new errors.ItemAlreadyExists(`Item '${item.contextIdentifier.name}.${item.aggregateIdentifier.name}.${item.aggregateIdentifier.id}.${item.name}.${item.id}' already exists.`);
    }

    queue.items.push(item);

    this.repairUp({ queue });
  }

  public async enqueue ({ item }: { item: TItem }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.enqueueInternal({ item })
    );
  }

  protected lockNextInternal (): { item: TItem; token: string } | undefined {
    if (this.queues.length === 0) {
      return;
    }

    const queue = this.queues[0]!;

    if (queue.lock && queue.lock.until > Date.now()) {
      return;
    }

    const item = queue.items[0];

    const until = Date.now() + this.expirationTime;
    const token = uuid();

    queue.lock = { until, token };

    this.repairDown({ queue });

    return { item, token };
  }

  public async lockNext (): Promise<{ item: TItem; token: string } | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<{ item: TItem; token: string } | undefined> => this.lockNextInternal()
    );
  }

  protected renewLockInternal ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): void {
    const queue = this.getQueueIfLocked({ itemIdentifier, token });

    queue.lock!.until = Date.now() + this.expirationTime;

    this.repairDown({ queue });
  }

  public async renewLock ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.renewLockInternal({ itemIdentifier, token })
    );
  }

  protected acknowledgeInternal ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): void {
    const queue = this.getQueueIfLocked({ itemIdentifier, token });

    queue.items.shift();

    if (queue.items.length > 0) {
      queue.lock = undefined;
      this.repairDown({ queue });

      return;
    }

    this.removeInternal({ aggregateIdentifier: queue.aggregateIdentifier });
  }

  public async acknowledge ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.acknowledgeInternal({ itemIdentifier, token })
    );
  }

  protected destroyInternal (): void {
    this.queues = [];
    this.index = new Map();
    this.functionCallQueue.clear();
  }

  public async destroy (): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.destroyInternal()
    );
  }
}

export { InMemoryPriorityQueueStore };
