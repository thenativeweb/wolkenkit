import { errors } from '../../../common/errors';
import { getIndexOfLeftChild } from '../common/getIndexOfLeftChild';
import { getIndexOfParent } from '../common/getIndexOfParent';
import { getIndexOfRightChild } from '../common/getIndexOfRightChild';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { uuid } from 'uuidv4';

class InMemoryPriorityQueueStore<TItem> implements PriorityQueueStore<TItem> {
  protected expirationTime: number;

  protected queues: (Queue<TItem> | undefined)[];

  protected index: Map<string, number>;

  protected functionCallQueue: PQueue;

  /* eslint-disable class-methods-use-this */
  protected getPriority ({ queue }: { queue: Queue<TItem> }): number {
    if (queue.lock && queue.lock.until > Date.now()) {
      return Number.MAX_SAFE_INTEGER;
    }

    return queue.items[0].priority;
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

  public static async create<TItem> ({ expirationTime = 15_000 }: {
    expirationTime?: number;
  }): Promise<InMemoryPriorityQueueStore<TItem>> {
    return new InMemoryPriorityQueueStore<TItem>({ expirationTime });
  }

  protected repairUp ({ queue }: { queue: Queue<TItem> }): void {
    const index = this.index.get(queue.discriminator);

    if (index === undefined) {
      throw new errors.InvalidOperation();
    }
    if (index === 0) {
      return;
    }

    const parentIndex = getIndexOfParent({ index });
    const parentQueue = this.queues[parentIndex]!;

    const queuePriority = this.getPriority({ queue });
    const parentPriority = this.getPriority({ queue: parentQueue });

    if (parentPriority <= queuePriority) {
      return;
    }

    this.queues[parentIndex] = queue;
    this.queues[index] = parentQueue;
    this.index.set(queue.discriminator, parentIndex);
    this.index.set(parentQueue.discriminator, index);

    this.repairUp({ queue });
  }

  protected repairDown ({ queue }: { queue: Queue<TItem> }): void {
    const index = this.index.get(queue.discriminator);

    if (index === undefined) {
      throw new errors.InvalidOperation();
    }

    const leftChildIndex = getIndexOfLeftChild({ index });
    const rightChildIndex = getIndexOfRightChild({ index });

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
      this.index.set(queue.discriminator, leftChildIndex);
      this.index.set(leftChildQueue.discriminator, index);

      this.repairDown({ queue });
    } else {
      this.queues[rightChildIndex] = queue;
      this.queues[index] = rightChildQueue;
      this.index.set(queue.discriminator, rightChildIndex);
      this.index.set(rightChildQueue!.discriminator, index);

      this.repairDown({ queue });
    }
  }

  protected removeInternal ({ discriminator }: {
    discriminator: string;
  }): void {
    const queueIndex = this.index.get(discriminator);

    if (queueIndex === undefined) {
      throw new errors.InvalidOperation();
    }

    const lastQueue = this.queues.pop()!;

    this.index.delete(lastQueue.discriminator);

    if (queueIndex >= this.queues.length) {
      return;
    }

    this.queues[queueIndex] = lastQueue;
    this.index.set(lastQueue.discriminator, queueIndex);

    this.repairDown({ queue: lastQueue });
  }

  protected getQueueIfLocked ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Queue<TItem> {
    const queueIndex = this.index.get(discriminator);

    if (queueIndex === undefined) {
      throw new errors.ItemNotFound(`Item for discriminator '${discriminator}' not found.`);
    }

    const queue = this.queues[queueIndex]!;

    if (!queue.lock) {
      throw new errors.ItemNotLocked(`Item for discriminator '${discriminator}' not locked.`);
    }
    if (queue.lock.token !== token) {
      throw new errors.TokenMismatch(`Token mismatch for discriminator '${discriminator}'.`);
    }

    return queue;
  }

  protected enqueueInternal ({ item, discriminator, priority }: {
    item: TItem;
    discriminator: string;
    priority: number;
  }): void {
    const queueIndex = this.index.get(discriminator) ?? this.queues.length;
    let queue = this.queues[queueIndex];

    if (!queue) {
      queue = {
        discriminator,
        items: []
      };

      this.queues.push(queue);
      this.index.set(discriminator, queueIndex);
    }

    queue.items.push({ item, priority });

    this.repairUp({ queue });
  }

  public async enqueue ({ item, discriminator, priority }: {
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.enqueueInternal({ item, discriminator, priority })
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

    return { item: item.item, token };
  }

  public async lockNext (): Promise<{ item: TItem; token: string } | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<{ item: TItem; token: string } | undefined> => this.lockNextInternal()
    );
  }

  protected renewLockInternal ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): void {
    const queue = this.getQueueIfLocked({ discriminator, token });

    queue.lock!.until = Date.now() + this.expirationTime;

    this.repairDown({ queue });
  }

  public async renewLock ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.renewLockInternal({ discriminator, token })
    );
  }

  protected acknowledgeInternal ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): void {
    const queue = this.getQueueIfLocked({ discriminator, token });

    queue.items.shift();

    if (queue.items.length > 0) {
      queue.lock = undefined;
      this.repairDown({ queue });

      return;
    }

    this.removeInternal({ discriminator: queue.discriminator });
  }

  public async acknowledge ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.acknowledgeInternal({ discriminator, token })
    );
  }

  protected deferInternal ({ discriminator, token, priority }: {
    discriminator: string;
    token: string;
    priority: number;
  }): void {
    const queue = this.getQueueIfLocked({ discriminator, token });

    const [{ item }] = queue.items;

    this.acknowledgeInternal({ discriminator, token });
    this.enqueueInternal({ item, discriminator, priority });
  }

  public async defer ({ discriminator, token, priority }: {
    discriminator: string;
    token: string;
    priority: number;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => this.deferInternal({ discriminator, token, priority })
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
