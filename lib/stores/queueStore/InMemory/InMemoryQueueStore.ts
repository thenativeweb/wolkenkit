import { CommandData } from '../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../common/elements/CommandWithMetadata';
import { minBy } from 'lodash';
import { Queue } from '../Queue';
import { QueueStore } from '../QueueStore';
import uuid from 'uuidv4';

class InMemoryQueueStore implements QueueStore {
  protected database: { queues: Queue[] };

  protected processingDuration: number;

  protected constructor ({ processingDuration }: {
    processingDuration: number;
  }) {
    this.database = { queues: []};

    this.processingDuration = processingDuration;
  }

  public static async create ({ processingDuration = 30 * 1000 }: {
    processingDuration: number;
  }): Promise<InMemoryQueueStore> {
    const queuestore = new InMemoryQueueStore({ processingDuration });

    return queuestore;
  }

  protected getProcessingUntil (): number {
    const processingUntil = Date.now() + this.processingDuration;

    return processingUntil;
  }

  public async enqueueItem ({ item }: {
    item: CommandWithMetadata<CommandData>;
  }): Promise<void> {
    const { queues } = this.database;
    const aggregateId = item.aggregateIdentifier.id;

    let queue = queues.find(
      (queueCandidate): boolean => queueCandidate.aggregateId === aggregateId
    );

    if (!queue) {
      queue = {
        aggregateId,
        waitingSince: 0,
        processingUntil: 0,
        token: uuid.empty(),
        items: []
      };
      queues.push(queue);
    }

    queue.items.push(item);

    const [ oldestItem ] = queue.items;

    // Since we just pushed an item to the queue, we know that it can not be
    // undefined here.
    queue.waitingSince = oldestItem!.metadata.timestamp;
  }

  public async getNextUnprocessedItem (): Promise<{
    unprocessedItem: CommandWithMetadata<CommandData>;
    token: string;
  }> {
    const { queues } = this.database;

    const unprocessedQueues = queues.filter((queueCandidate): boolean =>
      queueCandidate.processingUntil < Date.now() &&
      queueCandidate.items.length > 0);

    if (unprocessedQueues.length === 0) {
      throw new Error('No unprocessed item found.');
    }

    const unprocessedQueue = minBy(unprocessedQueues, 'waitingSince');

    if (!unprocessedQueue) {
      throw new Error('No unprocessed item found.');
    }

    const [ unprocessedItem ] = unprocessedQueue.items;

    if (!unprocessedItem) {
      throw new Error('No unprocessed item found.');
    }

    const token = uuid();

    unprocessedQueue.processingUntil = this.getProcessingUntil();
    unprocessedQueue.token = token;

    return { unprocessedItem, token };
  }

  public async extendItemProcessingTime ({ item, token }: {
    item: CommandWithMetadata<CommandData>;
    token: string;
  }): Promise<void> {
    const { queues } = this.database;
    const aggregateId = item.aggregateIdentifier.id;

    const queue = queues.find((queueCandidate): boolean =>
      queueCandidate.aggregateId === aggregateId);

    if (!queue) {
      throw new Error('Item not found.');
    }
    if (queue.token !== token) {
      throw new Error('Invalid token.');
    }

    queue.processingUntil = this.getProcessingUntil();
  }

  public async dequeueItem ({ item, token }: {
    item: CommandWithMetadata<CommandData>;
    token: string;
  }): Promise<void> {
    const { queues } = this.database;
    const aggregateId = item.aggregateIdentifier.id;

    const queueIndex = queues.findIndex((queueCandidate): boolean =>
      queueCandidate.aggregateId === aggregateId);

    if (queueIndex === -1) {
      throw new Error('Item not found.');
    }

    const queue = queues[queueIndex];

    if (queue.token !== token) {
      throw new Error('Invalid token.');
    }

    queue.items.pop();

    if (queue.items.length === 0) {
      queues.splice(queueIndex, 1);

      return;
    }

    const [ oldestItem ] = queue.items;

    // Since we just checked that the number of items in the queue is not zero,
    // we know that it can't be undefined here.
    queue.waitingSince = oldestItem!.metadata.timestamp;
    queue.processingUntil = 0;
    queue.token = uuid.empty();
  }

  public async destroy (): Promise<void> {
    this.database = { queues: []};
  }
}

export { InMemoryQueueStore };
