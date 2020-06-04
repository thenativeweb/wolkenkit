import { errors } from '../../../common/errors';
import { getIndexOfLeftChild } from '../common/getIndexOfLeftChild';
import { getIndexOfParent } from '../common/getIndexOfParent';
import { getIndexOfRightChild } from '../common/getIndexOfRightChild';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { retry } from 'retry-ignore-abort';
import { TableNames } from './TableNames';
import { uuid } from 'uuidv4';
import { withTransaction } from '../../utils/postgres/withTransaction';
import { Client, Pool, PoolClient } from 'pg';

class PostgresPriorityQueueStore<TItem> implements PriorityQueueStore<TItem> {
  protected tableNames: TableNames;

  protected pool: Pool;

  protected disconnectWatcher: Client;

  protected expirationTime: number;

  protected functionCallQueue: PQueue;

  protected static getPriority ({ queue }: { queue: Queue }): number {
    if (queue.lock && queue.lock.until > Date.now()) {
      return Number.MAX_SAFE_INTEGER;
    }

    return queue.priority;
  }

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected async getDatabase (): Promise<PoolClient> {
    const database = await retry(async (): Promise<PoolClient> => {
      const connection = await this.pool.connect();

      return connection;
    });

    return database;
  }

  protected constructor ({ tableNames, pool, disconnectWatcher, expirationTime }: {
    tableNames: TableNames;
    pool: Pool;
    disconnectWatcher: Client;
    expirationTime: number;
  }) {
    this.tableNames = tableNames;
    this.pool = pool;
    this.disconnectWatcher = disconnectWatcher;
    this.expirationTime = expirationTime;
    this.functionCallQueue = new PQueue({ concurrency: 1 });
  }

  public static async create<TItem> ({
    hostName,
    port,
    userName,
    password,
    database,
    encryptConnection = false,
    tableNames,
    expirationTime = 15_000
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
    expirationTime?: number;
  }): Promise<PostgresPriorityQueueStore<TItem>> {
    const pool = new Pool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      ssl: encryptConnection
    });

    pool.on('error', (err: Error): never => {
      throw err;
    });

    const disconnectWatcher = new Client({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      ssl: encryptConnection
    });

    disconnectWatcher.on('end', PostgresPriorityQueueStore.onUnexpectedClose);
    disconnectWatcher.on('error', (err): never => {
      throw err;
    });

    await new Promise((resolve, reject): void => {
      try {
        disconnectWatcher.connect(resolve);
      } catch (ex) {
        reject(ex);
      }
    });

    const priorityQueueStore = new PostgresPriorityQueueStore<TItem>({
      pool,
      tableNames,
      disconnectWatcher,
      expirationTime
    });

    const connection = await priorityQueueStore.getDatabase();

    try {
      await retry(async (): Promise<void> => {
        await connection.query({
          name: 'create items table',
          text: `
            CREATE TABLE IF NOT EXISTS "${tableNames.items}"
            (
              "discriminator" varchar(100) NOT NULL,
              "indexInQueue" integer NOT NULL,
              "priority" bigint NOT NULL,
              "item" jsonb NOT NULL,
      
              CONSTRAINT "${tableNames.items}_pk" PRIMARY KEY ("discriminator", "indexInQueue")
            );
          `
        });
        await connection.query({
          name: 'create index on items table',
          text: `
            CREATE INDEX IF NOT EXISTS ON "${tableNames.items}" ("discriminator");
          `
        });
        await connection.query({
          name: 'create priority queue table',
          text: `
            CREATE TABLE IF NOT EXISTS "${tableNames.priorityQueue}"
            (
              "discriminator" varchar(100) NOT NULL,
              "indexInPriorityQueue" integer NOT NULL,
              "lockUntil" bigint,
              "lockToken" uuid,
      
              CONSTRAINT "${tableNames.priorityQueue}_pk" PRIMARY KEY ("discriminator")
            );
          `
        });
        await connection.query({
          name: 'create index on priority queue table',
          text: `
            CREATE UNIQUE INDEX IF NOT EXISTS ON "${tableNames.priorityQueue}" ("indexInPriorityQueue");
          `
        });
      }, {
        retries: 3,
        minTimeout: 100,
        factor: 1
      });
    } finally {
      connection.release();
    }

    return priorityQueueStore;
  }

  public async destroy (): Promise<void> {
    this.disconnectWatcher.removeListener('end', PostgresPriorityQueueStore.onUnexpectedClose);
    await this.disconnectWatcher.end();
    await this.pool.end();
  }

  protected async swapPositionsInPriorityQueue ({ connection, firstQueue, secondQueue }: {
    connection: PoolClient;
    firstQueue: Queue;
    secondQueue: Queue;
  }): Promise<void> {
    await connection.query({
      name: 'swap positions in priority queue - first to temp',
      text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "indexInPriorityQueue" = -1
          WHERE "discriminator" = $1;
      `,
      values: [ firstQueue.discriminator ]
    });
    await connection.query({
      name: 'swap positions in priority queue - second to first',
      text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "indexInPriorityQueue" = $1
          WHERE "discriminator" = $2;
      `,
      values: [ firstQueue.index, secondQueue.discriminator ]
    });
    await connection.query({
      name: 'swap positions in priority queue - first to second',
      text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "indexInPriorityQueue" = $1
          WHERE "discriminator" = $2;
      `,
      values: [ secondQueue.index, firstQueue.discriminator ]
    });
  }

  protected async repairUp ({ connection, discriminator }: {
    connection: PoolClient;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ connection, discriminator });

    if (queue) {
      throw new errors.InvalidOperation();
    }

    if (queue.index === 0) {
      return;
    }

    const parentIndex = getIndexOfParent({ index: queue.index });
    const parentQueue = (await this.getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue: parentIndex }))!;

    const queuePriority = PostgresPriorityQueueStore.getPriority({ queue });
    const parentQueuePriority = PostgresPriorityQueueStore.getPriority({ queue: parentQueue });

    if (parentQueuePriority <= queuePriority) {
      return;
    }

    await this.swapPositionsInPriorityQueue({
      connection,
      firstQueue: queue,
      secondQueue: parentQueue
    });

    await this.repairUp({ connection, discriminator: queue.discriminator });
  }

  protected async repairDown ({ connection, discriminator }: {
    connection: PoolClient;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ connection, discriminator });

    if (!queue) {
      throw new errors.InvalidOperation();
    }

    const leftChildIndex = getIndexOfLeftChild({ index: queue.index });
    const rightChildIndex = getIndexOfRightChild({ index: queue.index });

    const leftChildQueue = await this.getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue: leftChildIndex });

    if (!leftChildQueue) {
      // If no left child is found, there is no layer beneath the current queue
      // and we can stop here.
      return;
    }

    const rightChildQueue = await this.getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue: rightChildIndex });

    const queuePriority = PostgresPriorityQueueStore.getPriority({ queue });

    const leftChildQueuePriority = PostgresPriorityQueueStore.getPriority({ queue: leftChildQueue });
    const rightChildQueuePriority = rightChildQueue ?
      PostgresPriorityQueueStore.getPriority({ queue: rightChildQueue }) :
      Number.MAX_SAFE_INTEGER;

    if (
      queuePriority <= leftChildQueuePriority &&
      queuePriority <= rightChildQueuePriority
    ) {
      return;
    }

    if (leftChildQueuePriority <= rightChildQueuePriority) {
      await this.swapPositionsInPriorityQueue({
        connection,
        firstQueue: queue,
        secondQueue: leftChildQueue
      });

      await this.repairDown({ connection, discriminator: queue.discriminator });
    } else {
      await this.swapPositionsInPriorityQueue({
        connection,
        firstQueue: queue,
        secondQueue: rightChildQueue!
      });

      await this.repairDown({ connection, discriminator: queue.discriminator });
    }
  }

  protected async removeInternal ({ connection, discriminator }: {
    connection: PoolClient;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ connection, discriminator });

    if (!queue) {
      throw new errors.InvalidOperation();
    }

    await connection.query({
      name: 'remove queue from priority queue',
      text: `
        DELETE FROM "${this.tableNames.priorityQueue}"
          WHERE "discriminator" = $1;
          `,
      values: [ queue.discriminator ]
    });
    const { rowCount } = await connection.query({
      name: 'move last queue in priority queue to index of removed queue',
      text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "indexInPriorityQueue" = $1
          WHERE "indexInPriorityQueue" = MAX("indexInPriorityQueue");
      `,
      values: [ queue.index ]
    });

    // If the update did not change any rows, we removed the last queue and
    // don't have to repair.
    if (rowCount === 0) {
      return;
    }

    const { rows: [{ discriminator: movedQueueDiscriminator }] } = await connection.query({
      name: 'get discriminator of moved queue',
      text: `
        SELECT "discriminator" FROM "${this.tableNames.priorityQueue}"
          WHERE "indexInPriorityQueue" = $1;
      `,
      values: [ queue.index ]
    });

    await this.repairDown({ connection, discriminator: movedQueueDiscriminator });
  }

  protected async getQueueByDiscriminator ({ connection, discriminator }: {
    connection: PoolClient;
    discriminator: string;
  }): Promise<Queue | undefined> {
    const { rows } = await connection.query({
      name: 'get queue by discriminator',
      text: `
        SELECT 
            pq."indexInPriorityQueue" AS "indexInPriorityQueue",
            i."priority" AS "priority",
            pq."lockUntil" AS "lockUntil",
            pq."lockToken" AS "lockToken"
          FROM "${this.tableNames.priorityQueue}" AS pq
          JOIN "${this.tableNames.items}" AS i
            ON pq."discriminator" = i."discriminator"
          WHERE pq."discriminator" = $1 AND i."indexInQueue" = 0;
      `,
      values: [ discriminator ]
    });

    if (rows.length === 0) {
      return;
    }

    const queue: Queue = {
      discriminator,
      index: rows[0].indexInPriorityQueue,
      priority: rows[0].priority
    };

    if (rows[0].lockUntil) {
      queue.lock = {
        until: rows[0].lockUntil,
        token: rows[0].lockToken.toString()
      };
    }

    return queue;
  }

  protected async getQueueByIndexInPriorityQueue ({ connection, indexInPriorityQueue }: {
    connection: PoolClient;
    indexInPriorityQueue: number;
  }): Promise<Queue | undefined> {
    const { rows } = await connection.query({
      name: 'get queue by index in priority queue',
      text: `
        SELECT 
            pq."discriminator" AS "discriminator",
            i."priority" AS "priority",
            pq."lockUntil" AS "lockUntil",
            pq."lockToken" AS "lockToken"
          FROM "${this.tableNames.priorityQueue}" AS pq
          JOIN "${this.tableNames.items}" AS i
            ON pq."discriminator" = i."discriminator"
          WHERE pq."indexInPriorityQueue" = $1 AND i."indexInQueue" = 0;
      `,
      values: [ indexInPriorityQueue ]
    });

    if (rows.length === 0) {
      return;
    }

    const queue: Queue = {
      discriminator: rows[0].discriminator,
      index: indexInPriorityQueue,
      priority: rows[0].priority
    };

    if (rows[0].lockUntil) {
      queue.lock = {
        until: rows[0].lockUntil,
        token: rows[0].lockToken.toString()
      };
    }

    return queue;
  }

  protected async getFirstItemInQueue ({ connection, discriminator }: {
    connection: PoolClient;
    discriminator: string;
  }): Promise<TItem> {
    const { rows: [{ item }] } = await connection.query({
      name: 'get first item in queue',
      text: `
        SELECT "item" FROM "${this.tableNames.items}"
          WHERE "discriminator" = $1
          ORDER BY "indexInQueue" ASC
          LIMIT 1
      `,
      values: [ discriminator ]
    });

    if (!item) {
      throw new errors.InvalidOperation();
    }

    return item;
  }

  protected async getQueueIfLocked ({ connection, discriminator, token }: {
    connection: PoolClient;
    discriminator: string;
    token: string;
  }): Promise<Queue> {
    const queue = await this.getQueueByDiscriminator({ connection, discriminator });

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

  protected async enqueueInternal ({ connection, item, discriminator, priority }: {
    connection: PoolClient;
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    const { rows: [{ nextIndexInQueue }] } = await connection.query({
      name: 'get next index in queue',
      text: `
        SELECT COALESCE(MAX("indexInQueue") + 1, 0) AS "nextIndexInQueue"
          FROM "${this.tableNames.items}"
          WHERE "discriminator" = $1;
      `,
      values: [ discriminator ]
    });

    await connection.query({
      name: 'insert item into queue',
      text: `
        INSERT INTO "${this.tableNames.items}"
          ("discriminator", "indexInQueue", "priority", "item")
          VALUES ($1, $2, $3, $4);
      `,
      values: [ discriminator, nextIndexInQueue, priority, item ]
    });

    const { rows } = await connection.query({
      name: 'check if discriminator already exists in priority queue',
      text: `
        SELECT * FROM "${this.tableNames.priorityQueue}"
          WHERE "discriminator" = $1;
      `,
      values: [ discriminator ]
    });

    if (rows.length > 0) {
      return;
    }

    const { rows: [{ nextIndexInPriorityQueue }] } = await connection.query({
      name: 'get next index in priority queue',
      text: `
        SELECT COALESCE(MAX("indexInPriorityQueue") + 1, 0) AS "nextIndexInPriorityQueue"
          FROM "${this.tableNames.priorityQueue}";
      `
    });

    await connection.query({
      name: 'insert queue into priority queue',
      text: `
        INSERT INTO "${this.tableNames.priorityQueue}"
          ("discriminator", "indexInPriorityQueue")
          VALUES ($1, $2);
      `,
      values: [ discriminator, nextIndexInPriorityQueue ]
    });

    await this.repairUp({ connection, discriminator });
  }

  public async enqueue ({ item, discriminator, priority }: {
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        await withTransaction({
          getConnection: async (): Promise<PoolClient> => await this.getDatabase(),
          fn: async ({ connection }): Promise<void> => {
            await this.enqueueInternal({ connection, item, discriminator, priority });
          },
          async releaseConnection ({ connection }): Promise<void> {
            connection.release();
          }
        });
      }
    );
  }

  protected async lockNextInternal ({ connection }: {
    connection: PoolClient;
  }): Promise<{ item: TItem; token: string } | undefined> {
    const { rows } = await connection.query({
      name: 'get next unlocked queue in priority queue',
      text: `
        SELECT "discriminator" FROM "${this.tableNames.priorityQueue}"
          WHERE "lockUntil" IS NULL OR "lockUntil" <= $1
          ORDER BY "indexInPriorityQueue" ASC
          LIMIT 1
      `,
      values: [ Date.now() ]
    });

    if (rows.length === 0) {
      return;
    }

    const { discriminator } = rows[0];

    const item = await this.getFirstItemInQueue({ connection, discriminator });

    const until = Date.now() + this.expirationTime;
    const token = uuid();

    await connection.query({
      name: 'lock queue',
      text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "lockUntil" = $1, "lockToken" = $2
          WHERE "discriminator" = $3
      `,
      values: [ until, token, discriminator ]
    });

    await this.repairDown({ connection, discriminator });

    return { item, token };
  }

  public async lockNext (): Promise<{ item: TItem; token: string } | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<{ item: TItem; token: string } | undefined> => await withTransaction({
        getConnection: async (): Promise<PoolClient> => await this.getDatabase(),
        fn: async ({ connection }): Promise<{ item: TItem; token: string } | undefined> =>
          await this.lockNextInternal({ connection }),
        async releaseConnection ({ connection }): Promise<void> {
          connection.release();
        }
      })
    );
  }

  protected async renewLockInternal ({ connection, discriminator, token }: {
    connection: PoolClient;
    discriminator: string;
    token: string;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ connection, discriminator, token });
    const newUntil = Date.now() + this.expirationTime;

    await connection.query({
      name: 'renew lock on queue',
      text: `
        UPDATE "${this.tableNames.priorityQueue}"
          SET "lockUntil" = $1
          WHERE "discriminator" = $2;
      `,
      values: [ newUntil, queue.discriminator ]
    });

    await this.repairDown({ connection, discriminator: queue.discriminator });
  }

  public async renewLock ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        await withTransaction({
          getConnection: async (): Promise<PoolClient> => await this.getDatabase(),
          fn: async ({ connection }): Promise<void> => {
            await this.renewLockInternal({ connection, discriminator, token });
          },
          async releaseConnection ({ connection }): Promise<void> {
            connection.release();
          }
        });
      }
    );
  }

  protected async acknowledgeInternal ({ connection, discriminator, token }: {
    connection: PoolClient;
    discriminator: string;
    token: string;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ connection, discriminator, token });

    await connection.query({
      name: 'remove item from queue',
      text: `
        DELETE FROM "${this.tableNames.items}"
          WHERE "discriminator" = $1 AND "indexInQueue" = 0;
      `,
      values: [ queue.discriminator ]
    });

    const { rowCount } = await connection.query({
      name: 'update indexes of items in queue',
      text: `
        UPDATE "${this.tableNames.items}"
          SET "indexInQueue" = "indexInQueue" - 1
          WHERE "discriminator" = $1;
      `,
      values: [ queue.discriminator ]
    });

    if (rowCount > 0) {
      // If the indexes of any item were changed, i.e. if there are still items in the queue...
      await connection.query({
        name: 'reset lock on queue',
        text: `
          UPDATE "${this.tableNames.priorityQueue}"
            SET "lockUntil" = NULL, "lockToken" = NULL
            WHERE "discriminator" = $1;
        `,
        values: [ queue.discriminator ]
      });

      await this.repairDown({ connection, discriminator: queue.discriminator });

      return;
    }

    await this.removeInternal({ connection, discriminator: queue.discriminator });
  }

  public async acknowledge ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        await withTransaction({
          getConnection: async (): Promise<PoolClient> => await this.getDatabase(),
          fn: async ({ connection }): Promise<void> => {
            await this.acknowledgeInternal({ connection, discriminator, token });
          },
          async releaseConnection ({ connection }): Promise<void> {
            connection.release();
          }
        });
      }
    );
  }

  protected async deferInternal ({ connection, discriminator, token, priority }: {
    connection: PoolClient;
    discriminator: string;
    token: string;
    priority: number;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ connection, discriminator, token });

    const item = await this.getFirstItemInQueue({ connection, discriminator: queue.discriminator });

    await this.acknowledgeInternal({ connection, discriminator: queue.discriminator, token });
    await this.enqueueInternal({ connection, item, discriminator: queue.discriminator, priority });
  }

  public async defer ({ discriminator, token, priority }: {
    discriminator: string;
    token: string;
    priority: number;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        await withTransaction({
          getConnection: async (): Promise<PoolClient> => await this.getDatabase(),
          fn: async ({ connection }): Promise<void> => {
            await this.deferInternal({ connection, discriminator, token, priority });
          },
          async releaseConnection ({ connection }): Promise<void> {
            connection.release();
          }
        });
      }
    );
  }
}

export { PostgresPriorityQueueStore };
