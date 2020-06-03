import { errors } from '../../../common/errors';
import { getIndexOfLeftChild } from '../common/getIndexOfLeftChild';
import { getIndexOfParent } from '../common/getIndexOfParent';
import { getIndexOfRightChild } from '../common/getIndexOfRightChild';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { retry } from 'retry-ignore-abort';
import { runQuery } from '../../utils/mySql/runQuery';
import { TableNames } from './TableNames';
import { uuid } from 'uuidv4';
import { withTransaction } from '../../utils/mySql/withTransaction';
import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';

class MySqlPriorityQueueStore<TItem> implements PriorityQueueStore<TItem> {
  protected tableNames: TableNames;

  protected pool: Pool;

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

  protected static releaseConnection ({ connection }: {
    connection: PoolConnection;
  }): void {
    (connection as any).removeListener('end', MySqlPriorityQueueStore.onUnexpectedClose);
    connection.release();
  }

  protected async getDatabase (): Promise<PoolConnection> {
    const database = await retry(async (): Promise<PoolConnection> => new Promise((resolve, reject): void => {
      this.pool.getConnection((err: MysqlError | null, poolConnection): void => {
        if (err) {
          reject(err);

          return;
        }
        resolve(poolConnection);
      });
    }));

    return database;
  }

  protected constructor ({ tableNames, pool, expirationTime }: {
    tableNames: TableNames;
    pool: Pool;
    expirationTime: number;
  }) {
    this.tableNames = tableNames;
    this.pool = pool;
    this.expirationTime = expirationTime;
    this.functionCallQueue = new PQueue({ concurrency: 1 });
  }

  public static async create<TItem> ({
    hostName,
    port,
    userName,
    password,
    database,
    tableNames,
    expirationTime = 15_000
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    tableNames: TableNames;
    expirationTime: number;
  }): Promise<MySqlPriorityQueueStore<TItem>> {
    const pool = createPool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });

    pool.on('connection', (connection: PoolConnection): void => {
      connection.on('error', (err: Error): never => {
        throw err;
      });
      connection.on('end', MySqlPriorityQueueStore.onUnexpectedClose);
    });

    const priorityQueueStore = new MySqlPriorityQueueStore<TItem>({ tableNames, pool, expirationTime });
    const connection = await priorityQueueStore.getDatabase();

    const createUuidToBinFunction = `
      CREATE FUNCTION UuidToBin(_uuid CHAR(36))
        RETURNS BINARY(16)
        RETURN UNHEX(CONCAT(
          SUBSTR(_uuid, 15, 4),
          SUBSTR(_uuid, 10, 4),
          SUBSTR(_uuid, 1, 8),
          SUBSTR(_uuid, 20, 4),
          SUBSTR(_uuid, 25)
        ));
    `;

    try {
      await runQuery({ connection, query: createUuidToBinFunction });
    } catch (ex) {
      // If the function already exists, we can ignore this error; otherwise
      // rethrow it. Generally speaking, this should be done using a SQL clause
      // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
      // there is a ready-made function UUID_TO_BIN, but this is only available
      // from MySQL 8.0 upwards.
      if (!ex.message.includes('FUNCTION UuidToBin already exists')) {
        throw ex;
      }
    }

    const createUuidFromBinFunction = `
      CREATE FUNCTION UuidFromBin(_bin BINARY(16))
        RETURNS CHAR(36)
        RETURN LCASE(CONCAT_WS('-',
          HEX(SUBSTR(_bin,  5, 4)),
          HEX(SUBSTR(_bin,  3, 2)),
          HEX(SUBSTR(_bin,  1, 2)),
          HEX(SUBSTR(_bin,  9, 2)),
          HEX(SUBSTR(_bin, 11))
        ));
    `;

    try {
      await runQuery({ connection, query: createUuidFromBinFunction });
    } catch (ex) {
      // If the function already exists, we can ignore this error; otherwise
      // rethrow it. Generally speaking, this should be done using a SQL clause
      // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
      // there is a ready-made function BIN_TO_UUID, but this is only available
      // from MySQL 8.0 upwards.
      if (!ex.message.includes('FUNCTION UuidFromBin already exists')) {
        throw ex;
      }
    }

    const query = `
      CREATE TABLE IF NOT EXISTS \`${tableNames.items}\`
      (
        discriminator VARCHAR(100) NOT NULL,
        indexInQueue INT NOT NULL,
        priority BIGINT NOT NULL,
        item JSON NOT NULL,

        PRIMARY KEY (discriminator, indexInQueue),
        INDEX (discriminator)
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`${tableNames.priorityQueue}\`
      (
        discriminator VARCHAR(100) NOT NULL,
        indexInPriorityQueue INT NOT NULL,
        lockUntil BIGINT,
        lockToken BINARY(16),

        PRIMARY KEY (discriminator),
        UNIQUE INDEX (indexInPriorityQueue)
      ) ENGINE=InnoDB;
    `;

    await runQuery({ connection, query });

    MySqlPriorityQueueStore.releaseConnection({ connection });

    return priorityQueueStore;
  }

  public async destroy (): Promise<void> {
    await new Promise((resolve): void => {
      this.pool.end(resolve);
    });
  }

  protected async repairUp ({ connection, discriminator }: {
    connection: PoolConnection;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ connection, discriminator });

    if (queue === undefined) {
      throw new errors.InvalidOperation();
    }

    if (queue.index === 0) {
      return;
    }

    const parentIndex = getIndexOfParent({ index: queue.index });
    const parentQueue = (await this.getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue: parentIndex }))!;

    const queuePriority = MySqlPriorityQueueStore.getPriority({ queue });
    const parentQueuePriority = MySqlPriorityQueueStore.getPriority({ queue: parentQueue });

    if (parentQueuePriority <= queuePriority) {
      return;
    }

    await runQuery({
      connection,
      query: `
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET indexInPriorityQueue = -1
          WHERE discriminator = ?;
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET indexInPriorityQueue = ?
          WHERE discriminator = ?;
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET indexInPriorityQueue = ?
          WHERE indexInPriorityQueue = -1;
      `,
      parameters: [ parentQueue.discriminator, parentQueue.index, queue.discriminator, queue.index ]
    });

    await this.repairUp({ connection, discriminator: queue.discriminator });
  }

  protected async repairDown ({ connection, discriminator }: {
    connection: PoolConnection;
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

    const queuePriority = MySqlPriorityQueueStore.getPriority({ queue });

    const leftChildQueuePriority = MySqlPriorityQueueStore.getPriority({ queue: leftChildQueue });
    const rightChildQueuePriority = rightChildQueue ?
      MySqlPriorityQueueStore.getPriority({ queue: rightChildQueue }) :
      Number.MAX_SAFE_INTEGER;

    if (
      queuePriority <= leftChildQueuePriority &&
      queuePriority <= rightChildQueuePriority
    ) {
      return;
    }

    if (leftChildQueuePriority <= rightChildQueuePriority) {
      await runQuery({
        connection,
        query: `
          UPDATE \`${this.tableNames.priorityQueue}\`
            SET indexInPriorityQueue = -1
            WHERE discriminator = ?;
          UPDATE \`${this.tableNames.priorityQueue}\`
            SET indexInPriorityQueue = ?
            WHERE discriminator = ?;
          UPDATE \`${this.tableNames.priorityQueue}\`
            SET indexInPriorityQueue = ?
            WHERE indexInPriorityQueue = -1;
      `,
        parameters: [ leftChildQueue.discriminator, leftChildQueue.index, queue.discriminator, queue.index ]
      });

      await this.repairDown({ connection, discriminator: queue.discriminator });
    } else {
      await runQuery({
        connection,
        query: `
          UPDATE \`${this.tableNames.priorityQueue}\`
            SET indexInPriorityQueue = -1
            WHERE discriminator = ?;
          UPDATE \`${this.tableNames.priorityQueue}\`
            SET indexInPriorityQueue = ?
            WHERE discriminator = ?;
          UPDATE \`${this.tableNames.priorityQueue}\`
            SET indexInPriorityQueue = ?
            WHERE indexInPriorityQueue = -1;
      `,
        parameters: [ rightChildQueue!.discriminator, rightChildQueue!.index, queue.discriminator, queue.index ]
      });

      await this.repairDown({ connection, discriminator: queue.discriminator });
    }
  }

  protected async removeInternal ({ connection, discriminator }: {
    connection: PoolConnection;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ connection, discriminator });

    if (!queue) {
      throw new errors.InvalidOperation();
    }

    const [ results ] = await runQuery({
      connection,
      query: `
        DELETE FROM \`${this.tableNames.priorityQueue}\`
          WHERE discriminator = ?;
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET indexInPriorityQueue = ?
          ORDER BY indexInPriorityQueue DESC
          LIMIT 1;
        SELECT discriminator FROM \`${this.tableNames.priorityQueue}\`
          WHERE indexInPriorityQueue = ?;
      `,
      parameters: [ queue.discriminator, queue.index, queue.index ]
    });

    // If the update did not change any rows, we removed the last queue and
    // don't have to repair.
    if (results[1].changedRows === 0) {
      return;
    }

    await this.repairDown({ connection, discriminator: results[2][0].discriminator });
  }

  protected async getQueueByDiscriminator ({ connection, discriminator }: {
    connection: PoolConnection;
    discriminator: string;
  }): Promise<Queue | undefined> {
    const [ rows ] = await runQuery({
      connection,
      query: `
        SELECT 
            pq.indexInPriorityQueue AS indexInPriorityQueue,
            i.priority AS priority,
            pq.lockUntil AS lockUntil,
            UuidFromBin(pq.lockToken) AS lockToken
          FROM \`${this.tableNames.priorityQueue}\` AS pq
          JOIN \`${this.tableNames.items}\` AS i
            ON pq.discriminator = i.discriminator
          WHERE pq.discriminator = ? AND i.indexInQueue = 0;
      `,
      parameters: [ discriminator ]
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
        token: rows[0].lockToken
      };
    }

    return queue;
  }

  protected async getQueueByIndexInPriorityQueue ({ connection, indexInPriorityQueue }: {
    connection: PoolConnection;
    indexInPriorityQueue: number;
  }): Promise<Queue | undefined> {
    const [ rows ] = await runQuery({
      connection,
      query: `
        SELECT 
            pq.discriminator AS discriminator,
            i.priority AS priority,
            pq.lockUntil AS lockUntil,
            UuidFromBin(pq.lockToken) AS lockToken
          FROM \`${this.tableNames.priorityQueue}\` AS pq
          JOIN \`${this.tableNames.items}\` AS i
            ON pq.discriminator = i.discriminator
          WHERE pq.indexInPriorityQueue = ? AND i.indexInQueue = 0;
      `,
      parameters: [ indexInPriorityQueue ]
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
        token: rows[0].lockToken
      };
    }

    return queue;
  }

  protected async getFirstItemInQueue ({ connection, discriminator }: {
    connection: PoolConnection;
    discriminator: string;
  }): Promise<TItem> {
    const [[{ item }]] = await runQuery({
      connection,
      query: `
        SELECT item FROM \`${this.tableNames.items}\`
          WHERE discriminator = ?
          ORDER BY indexInQueue ASC
          LIMIT 1
      `,
      parameters: [ discriminator ]
    });

    if (!item) {
      throw new errors.InvalidOperation();
    }

    return JSON.parse(item);
  }

  protected async getQueueIfLocked ({ connection, discriminator, token }: {
    connection: PoolConnection;
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
    connection: PoolConnection;
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    const [[{ nextIndexInQueue }]] = await runQuery({
      connection,
      query: `
        SELECT COALESCE(MAX(indexInQueue) + 1, 0) as nextIndexInQueue FROM \`${this.tableNames.items}\` WHERE discriminator = ?;
      `,
      parameters: [ discriminator ]
    });

    await runQuery({
      connection,
      query: `
        INSERT INTO \`${this.tableNames.items}\` (discriminator, indexInQueue, priority, item)
          VALUES (?, ?, ?, ?);
      `,
      parameters: [ discriminator, nextIndexInQueue, priority, JSON.stringify(item) ]
    });

    try {
      const [[{ nextIndexInPriorityQueue }]] = await runQuery({
        connection,
        query: `
          SELECT COALESCE(MAX(indexInPriorityQueue) + 1, 0) as nextIndexInPriorityQueue FROM \`${this.tableNames.priorityQueue}\`;
        `,
        parameters: [ discriminator ]
      });

      await runQuery({
        connection,
        query: `
          INSERT INTO \`${this.tableNames.priorityQueue}\` (discriminator, indexInPriorityQueue)
            VALUES (?, ?);
        `,
        parameters: [ discriminator, nextIndexInPriorityQueue ]
      });
    } catch (ex) {
      if (ex.code === 'ER_DUP_ENTRY' && ex.sqlMessage.endsWith('for key \'PRIMARY\'')) {
        return;
      }

      throw ex;
    }

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
          getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
          fn: async ({ connection }): Promise<void> => {
            await this.enqueueInternal({ connection, item, discriminator, priority });
          },
          async releaseConnection ({ connection }): Promise<void> {
            MySqlPriorityQueueStore.releaseConnection({ connection });
          }
        });
      }
    );
  }

  protected async lockNextInternal ({ connection }: {
    connection: PoolConnection;
  }): Promise<{ item: TItem; token: string } | undefined> {
    const [ rows ] = await runQuery({
      connection,
      query: `
        SELECT discriminator FROM \`${this.tableNames.priorityQueue}\`
          WHERE lockUntil IS NULL OR lockUntil <= ?
          ORDER BY indexInPriorityQueue ASC
          LIMIT 1
      `,
      parameters: [ Date.now() ]
    });

    if (rows.length === 0) {
      return;
    }

    const { discriminator } = rows[0];

    const item = await this.getFirstItemInQueue({ connection, discriminator });

    const until = Date.now() + this.expirationTime;
    const token = uuid();

    await runQuery({
      connection,
      query: `
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET lockUntil = ?, lockToken = UuidToBin(?)
          WHERE discriminator = ?
      `,
      parameters: [ until, token, discriminator ]
    });

    await this.repairDown({ connection, discriminator });

    return { item, token };
  }

  public async lockNext (): Promise<{ item: TItem; token: string } | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<{ item: TItem; token: string } | undefined> => await withTransaction({
        getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
        fn: async ({ connection }): Promise<{ item: TItem; token: string } | undefined> =>
          await this.lockNextInternal({ connection }),
        async releaseConnection ({ connection }): Promise<void> {
          MySqlPriorityQueueStore.releaseConnection({ connection });
        }
      })
    );
  }

  protected async renewLockInternal ({ connection, discriminator, token }: {
    connection: PoolConnection;
    discriminator: string;
    token: string;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ connection, discriminator, token });
    const newUntil = Date.now() + this.expirationTime;

    await runQuery({
      connection,
      query: `
        UPDATE \`${this.tableNames.priorityQueue}\`
          SET lockUntil = ?
          WHERE discriminator = ?;
      `,
      parameters: [ newUntil, queue.discriminator ]
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
          getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
          fn: async ({ connection }): Promise<void> => {
            await this.renewLockInternal({ connection, discriminator, token });
          },
          async releaseConnection ({ connection }): Promise<void> {
            MySqlPriorityQueueStore.releaseConnection({ connection });
          }
        });
      }
    );
  }

  protected async acknowledgeInternal ({ connection, discriminator, token }: {
    connection: PoolConnection;
    discriminator: string;
    token: string;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ connection, discriminator, token });

    const [ results ] = await runQuery({
      connection,
      query: `
        DELETE FROM \`${this.tableNames.items}\`
          WHERE discriminator = ? AND indexInQueue = 0;
        UPDATE \`${this.tableNames.items}\`
          SET indexInQueue = indexInQueue - 1
          WHERE discriminator = ?
          ORDER BY indexInQueue ASC;
      `,
      parameters: [ queue.discriminator, queue.discriminator ]
    });

    if (results[1].changedRows > 0) {
      // If the indexes of any item were changed, i.e. if there are still items in the queue...
      await runQuery({
        connection,
        query: `
          UPDATE \`${this.tableNames.priorityQueue}\`
            SET lockUntil = NULL, lockToken = NULL
            WHERE discriminator = ?;
        `,
        parameters: [ queue.discriminator ]
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
          getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
          fn: async ({ connection }): Promise<void> => {
            await this.acknowledgeInternal({ connection, discriminator, token });
          },
          async releaseConnection ({ connection }): Promise<void> {
            MySqlPriorityQueueStore.releaseConnection({ connection });
          }
        });
      }
    );
  }

  protected async deferInternal ({ connection, discriminator, token, priority }: {
    connection: PoolConnection;
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
          getConnection: async (): Promise<PoolConnection> => await this.getDatabase(),
          fn: async ({ connection }): Promise<void> => {
            await this.deferInternal({ connection, discriminator, token, priority });
          },
          async releaseConnection ({ connection }): Promise<void> {
            MySqlPriorityQueueStore.releaseConnection({ connection });
          }
        });
      }
    );
  }
}

export { MySqlPriorityQueueStore };
