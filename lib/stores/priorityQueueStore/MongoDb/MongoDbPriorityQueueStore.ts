import { CollectionNames } from './CollectionNames';
import { errors } from '../../../common/errors';
import { getIndexOfLeftChild } from '../shared/getIndexOfLeftChild';
import { getIndexOfParent } from '../shared/getIndexOfParent';
import { getIndexOfRightChild } from '../shared/getIndexOfRightChild';
import { parse } from 'url';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { retry } from 'retry-ignore-abort';
import { uuid } from 'uuidv4';
import { withTransaction } from '../../utils/mongoDb/withTransaction';
import { ClientSession, Collection, Db, MongoClient } from 'mongodb';

class MongoDbPriorityQueueStore<TItem> implements PriorityQueueStore<TItem> {
  protected client: MongoClient;

  protected db: Db;

  protected collectionNames: CollectionNames;

  protected collections: {
    queues: Collection<any>;
  };

  protected expirationTime: number;

  protected functionCallQueue: PQueue;

  protected static getPriority<TItem> ({ queue }: { queue: Queue<TItem> }): number {
    if (queue.lock && queue.lock.until > Date.now()) {
      return Number.MAX_SAFE_INTEGER;
    }

    return queue.items[0].priority;
  }

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected constructor ({ client, db, collectionNames, collections, expirationTime }: {
    client: MongoClient;
    db: Db;
    collectionNames: CollectionNames;
    collections: {
      queues: Collection<any>;
    };
    expirationTime: number;
  }) {
    this.client = client;
    this.db = db;
    this.collectionNames = collectionNames;
    this.collections = collections;
    this.expirationTime = expirationTime;
    this.functionCallQueue = new PQueue({ concurrency: 1 });
  }

  public static async create<TItem> ({
    hostName,
    port,
    userName,
    password,
    database,
    collectionNames,
    expirationTime = 15_000
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    collectionNames: CollectionNames;
    expirationTime?: number;
  }): Promise<MongoDbPriorityQueueStore<TItem>> {
    const url = `mongodb://${userName}:${password}@${hostName}:${port}/${database}`;

    const client = await retry(async (): Promise<MongoClient> => {
      const connection = await MongoClient.connect(
        url,
        // eslint-disable-next-line id-length
        { w: 1, useNewUrlParser: true, useUnifiedTopology: true }
      );

      return connection;
    });

    const { pathname } = parse(url);

    if (!pathname) {
      throw new Error('Pathname is missing.');
    }

    const databaseName = pathname.slice(1);
    const db = client.db(databaseName);

    db.on('close', MongoDbPriorityQueueStore.onUnexpectedClose);

    const collections = {
      queues: db.collection(collectionNames.queues)
    };

    const priorityQueueStore = new MongoDbPriorityQueueStore<TItem>({
      client,
      db,
      collectionNames,
      collections,
      expirationTime
    });

    await collections.queues.createIndexes([
      {
        key: { discriminator: 1 },
        name: `${collectionNames.queues}_discriminator`,
        unique: true
      },
      {
        key: { indexInPriorityQueue: 1 },
        name: `${collectionNames.queues}_indexInPriorityQueue`,
        unique: true
      }
    ]);

    return priorityQueueStore;
  }

  public async destroy (): Promise<void> {
    this.db.removeListener('close', MongoDbPriorityQueueStore.onUnexpectedClose);
    await this.client.close(true);
  }

  protected async swapPositionsInPriorityQueue ({ session, firstQueue, secondQueue }: {
    session: ClientSession;
    firstQueue: Queue<TItem>;
    secondQueue: Queue<TItem>;
  }): Promise<void> {
    await this.collections.queues.updateOne(
      { discriminator: firstQueue.discriminator },
      { $set: { indexInPriorityQueue: -1 }},
      { session }
    );
    await this.collections.queues.updateOne(
      { discriminator: secondQueue.discriminator },
      { $set: { indexInPriorityQueue: firstQueue.indexInPriorityQueue }},
      { session }
    );
    await this.collections.queues.updateOne(
      { discriminator: firstQueue.discriminator },
      { $set: { indexInPriorityQueue: secondQueue.indexInPriorityQueue }},
      { session }
    );
  }

  protected async repairUp ({ session, discriminator }: {
    session: ClientSession;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ session, discriminator });

    if (!queue) {
      throw new errors.InvalidOperation();
    }

    if (queue.indexInPriorityQueue === 0) {
      return;
    }

    const parentIndex = getIndexOfParent({ index: queue.indexInPriorityQueue });
    const parentQueue = (await this.getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue: parentIndex }))!;

    const queuePriority = MongoDbPriorityQueueStore.getPriority({ queue });
    const parentQueuePriority = MongoDbPriorityQueueStore.getPriority({ queue: parentQueue });

    if (parentQueuePriority <= queuePriority) {
      return;
    }

    await this.swapPositionsInPriorityQueue({
      session,
      firstQueue: queue,
      secondQueue: parentQueue
    });

    await this.repairUp({ session, discriminator: queue.discriminator });
  }

  protected async repairDown ({ session, discriminator }: {
    session: ClientSession;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ session, discriminator });

    if (!queue) {
      throw new errors.InvalidOperation();
    }

    const leftChildIndex = getIndexOfLeftChild({ index: queue.indexInPriorityQueue });
    const rightChildIndex = getIndexOfRightChild({ index: queue.indexInPriorityQueue });

    const leftChildQueue = await this.getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue: leftChildIndex });

    if (!leftChildQueue) {
      // If no left child is found, there is no layer beneath the current queue
      // and we can stop here.
      return;
    }

    const rightChildQueue = await this.getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue: rightChildIndex });

    const queuePriority = MongoDbPriorityQueueStore.getPriority({ queue });

    const leftChildQueuePriority = MongoDbPriorityQueueStore.getPriority({ queue: leftChildQueue });
    const rightChildQueuePriority = rightChildQueue ?
      MongoDbPriorityQueueStore.getPriority({ queue: rightChildQueue }) :
      Number.MAX_SAFE_INTEGER;

    if (
      queuePriority <= leftChildQueuePriority &&
      queuePriority <= rightChildQueuePriority
    ) {
      return;
    }

    if (leftChildQueuePriority <= rightChildQueuePriority) {
      await this.swapPositionsInPriorityQueue({
        session,
        firstQueue: queue,
        secondQueue: leftChildQueue
      });

      await this.repairDown({ session, discriminator: queue.discriminator });
    } else {
      await this.swapPositionsInPriorityQueue({
        session,
        firstQueue: queue,
        secondQueue: rightChildQueue!
      });

      await this.repairDown({ session, discriminator: queue.discriminator });
    }
  }

  protected async removeInternal ({ session, discriminator }: {
    session: ClientSession;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ session, discriminator });

    if (!queue) {
      throw new errors.InvalidOperation();
    }

    await this.collections.queues.deleteOne(
      { discriminator: queue.discriminator },
      { session }
    );

    const queueToUpdate = await this.collections.queues.findOne(
      {},
      { sort: [[ 'indexInPriorityQueue', -1 ]], session }
    );

    if (!queueToUpdate) {
      return;
    }

    await this.collections.queues.updateOne(
      queueToUpdate,
      { $set: { indexInPriorityQueue: queue.indexInPriorityQueue }},
      { session }
    );

    await this.repairDown({ session, discriminator: queueToUpdate.discriminator });
  }

  protected async getQueueByDiscriminator ({ session, discriminator }: {
    session: ClientSession;
    discriminator: string;
  }): Promise<Queue<TItem> | undefined> {
    const queue = await this.collections.queues.findOne(
      { discriminator },
      {
        session,
        projection: { _id: 0 }
      }
    );

    if (!queue) {
      return;
    }

    return queue;
  }

  protected async getQueueByIndexInPriorityQueue ({ session, indexInPriorityQueue }: {
    session: ClientSession;
    indexInPriorityQueue: number;
  }): Promise<Queue<TItem> | undefined> {
    const queue = await this.collections.queues.findOne(
      { indexInPriorityQueue },
      {
        session,
        projection: { _id: 0 }
      }
    );

    if (!queue) {
      return;
    }

    return queue;
  }

  protected async getQueueIfLocked ({ session, discriminator, token }: {
    session: ClientSession;
    discriminator: string;
    token: string;
  }): Promise<Queue<TItem>> {
    const queue = await this.getQueueByDiscriminator({ session, discriminator });

    if (!queue) {
      throw new errors.ItemNotFound(`Item for discriminator '${discriminator}' not found.`);
    }

    if (!queue.lock) {
      throw new errors.ItemNotLocked(`Item for discriminator '${discriminator}' not locked.`);
    }
    if (queue.lock.token !== token) {
      throw new errors.TokenMismatch(`Token mismatch for discriminator '${discriminator}'.`);
    }

    return queue;
  }

  protected async enqueueInternal ({ session, item, discriminator, priority }: {
    session: ClientSession;
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    let queue = await this.getQueueByDiscriminator({ session, discriminator });

    if (!queue) {
      const nextIndexInPriorityQueue = await this.collections.queues.countDocuments(
        {},
        { session }
      );

      queue = {
        discriminator,
        indexInPriorityQueue: nextIndexInPriorityQueue,
        lock: undefined,
        items: []
      };

      await this.collections.queues.insertOne(
        queue,
        { session }
      );
    }

    await this.collections.queues.updateOne(
      { discriminator },
      { $push: { items: { item, priority }}},
      { session }
    );

    await this.repairUp({ session, discriminator });
  }

  public async enqueue ({ item, discriminator, priority }: {
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        await withTransaction({
          client: this.client,
          fn: async ({ session }): Promise<void> => {
            await this.enqueueInternal({ session, item, discriminator, priority });
          }
        });
      }
    );
  }

  protected async lockNextInternal ({ session }: {
    session: ClientSession;
  }): Promise<{ item: TItem; token: string } | undefined> {
    const queue = await this.getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue: 0 });

    if (!queue) {
      return;
    }
    if (queue.lock && queue.lock.until > Date.now()) {
      return;
    }

    const item = queue.items[0];

    const until = Date.now() + this.expirationTime;
    const token = uuid();

    await this.collections.queues.updateOne(
      { discriminator: queue.discriminator },
      { $set: { lock: { until, token }}},
      { session }
    );

    await this.repairDown({ session, discriminator: queue.discriminator });

    return { item: item.item, token };
  }

  public async lockNext (): Promise<{ item: TItem; token: string } | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<{ item: TItem; token: string } | undefined> =>
        await withTransaction({
          client: this.client,
          fn: async ({ session }): Promise<{ item: TItem; token: string } | undefined> =>
            await this.lockNextInternal({ session })
        })
    );
  }

  protected async renewLockInternal ({ session, discriminator, token }: {
    session: ClientSession;
    discriminator: string;
    token: string;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ session, discriminator, token });

    await this.collections.queues.updateOne(
      { discriminator: queue.discriminator, 'lock.token': token },
      { $set: { 'lock.until': Date.now() + this.expirationTime }},
      { session }
    );

    await this.repairDown({ session, discriminator: queue.discriminator });
  }

  public async renewLock ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        await withTransaction({
          client: this.client,
          fn: async ({ session }): Promise<void> => {
            await this.renewLockInternal({ session, discriminator, token });
          }
        });
      }
    );
  }

  protected async acknowledgeInternal ({ session, discriminator, token }: {
    session: ClientSession;
    discriminator: string;
    token: string;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ session, discriminator, token });

    await this.collections.queues.updateOne(
      { discriminator: queue.discriminator, 'lock.token': token },
      { $pop: { items: -1 }},
      { session }
    );

    const queueAfterUpdate = (await this.getQueueByDiscriminator({ session, discriminator }))!;

    if (queueAfterUpdate.items.length > 0) {
      await this.collections.queues.updateOne(
        { discriminator: queueAfterUpdate.discriminator, 'lock.token': token },
        { $set: { lock: undefined }},
        { session }
      );

      await this.repairDown({ session, discriminator });

      return;
    }

    await this.removeInternal({ session, discriminator });
  }

  public async acknowledge ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        await withTransaction({
          client: this.client,
          fn: async ({ session }): Promise<void> => {
            await this.acknowledgeInternal({ session, discriminator, token });
          }
        });
      }
    );
  }

  protected async deferInternal ({ session, discriminator, token, priority }: {
    session: ClientSession;
    discriminator: string;
    token: string;
    priority: number;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ session, discriminator, token });
    const item = queue.items[0];

    await this.acknowledgeInternal({ session, discriminator: queue.discriminator, token });
    await this.enqueueInternal({ session, item: item.item, discriminator: queue.discriminator, priority });
  }

  public async defer ({ discriminator, token, priority }: {
    discriminator: string;
    token: string;
    priority: number;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        await withTransaction({
          client: this.client,
          fn: async ({ session }): Promise<void> => {
            await this.deferInternal({ session, discriminator, token, priority });
          }
        });
      }
    );
  }
}

export { MongoDbPriorityQueueStore };
