import _ from 'lodash';
import uuid from 'uuidv4';

const { minBy } = _;

class Queuestore {
  private database: {
    queues: string[];
  } = { queues: []};

  private processingDuration: number = 30 * 1000;

  private getProcessingUntil (): number {
    const processingUntil = Date.now() + this.processingDuration;

    return processingUntil;
  }

  public async initialize ({ processingDuration }: {
    processingDuration?: number;
  } = {}): Promise<void> {
    this.database = { queues: []};

    if (processingDuration) {
      this.processingDuration = processingDuration;
    }
  }

  public async enqueueItem ({ item }): Promise<void> {
    if (!item) {
      throw new Error('Item is missing.');
    }

    const { queues } = this.database;
    const aggregateId = item.aggregate.id;

    let queue = queues.find(
      queueCandidate => queueCandidate.aggregateId === aggregateId
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

    const [oldestItem] = queue.items;

    queue.waitingSince = oldestItem.metadata.timestamp;
  }

  public async getNextUnprocessedItem (): Promise<void> {
    const { queues } = this.database;

    const unprocessedQueues = queues.filter(
      queueCandidate =>
        queueCandidate.processingUntil < Date.now() &&
        queueCandidate.items.length > 0
    );

    if (unprocessedQueues.length === 0) {
      throw new Error('No unprocessed item found.');
    }

    const unprocessedQueue = minBy(unprocessedQueues, 'waitingSince');
    const [unprocessedItem] = unprocessedQueue.items;

    if (!unprocessedItem) {
      throw new Error('No unprocessed item found.');
    }

    const token = uuid();

    unprocessedQueue.processingUntil = this.getProcessingUntil();
    unprocessedQueue.token = token;

    return { unprocessedItem, token };
  }

  public async extendItemProcessingTime ({ item, token }): Promise<void> {
    if (!item) {
      throw new Error('Item is missing.');
    }
    if (!token) {
      throw new Error('Token is missing.');
    }

    const { queues } = this.database;
    const aggregateId = item.aggregate.id;

    const queue = queues.find(
      queueCandidate => queueCandidate.aggregateId === aggregateId
    );

    if (!queue) {
      throw new Error('Item not found.');
    }
    if (queue.token !== token) {
      throw new Error('Invalid token.');
    }

    queue.processingUntil = this.getProcessingUntil();
  }

  public async dequeueItem ({ item, token }): Promise<void> {
    if (!item) {
      throw new Error('Item is missing.');
    }
    if (!token) {
      throw new Error('Token is missing.');
    }

    const { queues } = this.database;
    const aggregateId = item.aggregate.id;

    const queueIndex = queues.findIndex(
      queueCandidate => queueCandidate.aggregateId === aggregateId
    );

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

    const [oldestItem] = queue.items[0];

    queue.waitingSince = oldestItem.metadata.timestamp;
    queue.processingUntil = 0;
    queue.token = uuid.empty();
  }

  public async destroy (): Promise<void> {
    this.database = { queues: []};
  }
}

export default Queuestore;
