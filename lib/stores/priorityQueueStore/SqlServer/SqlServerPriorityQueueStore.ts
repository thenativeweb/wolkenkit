import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
import { errors } from '../../../common/errors';
import { getIndexOfLeftChild } from '../shared/getIndexOfLeftChild';
import { getIndexOfParent } from '../shared/getIndexOfParent';
import { getIndexOfRightChild } from '../shared/getIndexOfRightChild';
import { LockMetadata } from '../LockMetadata';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { SqlServerPriorityQueueStoreOptions } from './SqlServerPriorityQueueStoreOptions';
import { TableNames } from './TableNames';
import { v4 } from 'uuid';
import { ConnectionPool, RequestError, Transaction, TYPES as Types } from 'mssql';

class SqlServerPriorityQueueStore<TItem extends object, TItemIdentifier> implements PriorityQueueStore<TItem, TItemIdentifier> {
  protected tableNames: TableNames;

  protected pool: ConnectionPool;

  protected doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;

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

  protected constructor ({ tableNames, pool, doesIdentifierMatchItem, expirationTime }: {
    tableNames: TableNames;
    pool: ConnectionPool;
    doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    expirationTime: number;
  }) {
    this.tableNames = tableNames;
    this.pool = pool;
    this.doesIdentifierMatchItem = doesIdentifierMatchItem;
    this.expirationTime = expirationTime;
    this.functionCallQueue = new PQueue({ concurrency: 1 });
  }

  public static async create<TCreateItem extends object, TCreateItemIdentifier> (
    {
      doesIdentifierMatchItem,
      expirationTime = 15_000,
      hostName,
      port,
      userName,
      password,
      database,
      tableNames,
      encryptConnection = false
    }: SqlServerPriorityQueueStoreOptions<TCreateItem, TCreateItemIdentifier>
  ): Promise<SqlServerPriorityQueueStore<TCreateItem, TCreateItemIdentifier>> {
    const pool = new ConnectionPool({
      server: hostName,
      port,
      user: userName,
      password,
      database,
      options: {
        enableArithAbort: true,
        encrypt: encryptConnection,
        trustServerCertificate: false
      }
    });

    pool.on('error', (): void => {
      SqlServerPriorityQueueStore.onUnexpectedClose();
    });

    await pool.connect();

    return new SqlServerPriorityQueueStore<TCreateItem, TCreateItemIdentifier>({
      tableNames,
      pool,
      doesIdentifierMatchItem,
      expirationTime
    });
  }

  protected async swapPositionsInPriorityQueue ({ transaction, firstQueue, secondQueue }: {
    transaction: Transaction;
    firstQueue: Queue;
    secondQueue: Queue;
  }): Promise<void> {
    const request = transaction.request();

    request.input('firstDiscriminator', Types.NVarChar, firstQueue.discriminator);
    request.input('firstIndex', Types.Int, firstQueue.index);
    request.input('secondDiscriminator', Types.NVarChar, secondQueue.discriminator);
    request.input('secondIndex', Types.Int, secondQueue.index);

    await request.query(`
      UPDATE [${this.tableNames.priorityQueue}]
        SET [indexInPriorityQueue] = -1
        WHERE [discriminator] = @firstDiscriminator;
      UPDATE [${this.tableNames.priorityQueue}]
        SET [indexInPriorityQueue] = @firstIndex
        WHERE [discriminator] = @secondDiscriminator;
      UPDATE [${this.tableNames.priorityQueue}]
        SET [indexInPriorityQueue] = @secondIndex
        WHERE [discriminator] = @firstDiscriminator;
    `);
  }

  protected async repairUp ({ transaction, discriminator }: {
    transaction: Transaction;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ transaction, discriminator });

    if (!queue) {
      throw new errors.InvalidOperation();
    }

    if (queue.index === 0) {
      return;
    }

    const parentIndex = getIndexOfParent({ index: queue.index });
    const parentQueue = (await this.getQueueByIndexInPriorityQueue({ transaction, indexInPriorityQueue: parentIndex }))!;

    const queuePriority = SqlServerPriorityQueueStore.getPriority({ queue });
    const parentQueuePriority = SqlServerPriorityQueueStore.getPriority({ queue: parentQueue });

    if (parentQueuePriority <= queuePriority) {
      return;
    }

    await this.swapPositionsInPriorityQueue({
      transaction,
      firstQueue: queue,
      secondQueue: parentQueue
    });

    await this.repairUp({ transaction, discriminator: queue.discriminator });
  }

  protected async repairDown ({ transaction, discriminator }: {
    transaction: Transaction;
    discriminator: string;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ transaction, discriminator });

    if (!queue) {
      throw new errors.InvalidOperation();
    }

    const leftChildIndex = getIndexOfLeftChild({ index: queue.index });
    const rightChildIndex = getIndexOfRightChild({ index: queue.index });

    const leftChildQueue = await this.getQueueByIndexInPriorityQueue({ transaction, indexInPriorityQueue: leftChildIndex });

    if (!leftChildQueue) {
      // If no left child is found, there is no layer beneath the current queue
      // and we can stop here.
      return;
    }

    const rightChildQueue = await this.getQueueByIndexInPriorityQueue({ transaction, indexInPriorityQueue: rightChildIndex });

    const queuePriority = SqlServerPriorityQueueStore.getPriority({ queue });

    const leftChildQueuePriority = SqlServerPriorityQueueStore.getPriority({ queue: leftChildQueue });
    const rightChildQueuePriority = rightChildQueue ?
      SqlServerPriorityQueueStore.getPriority({ queue: rightChildQueue }) :
      Number.MAX_SAFE_INTEGER;

    if (
      queuePriority <= leftChildQueuePriority &&
      queuePriority <= rightChildQueuePriority
    ) {
      return;
    }

    if (leftChildQueuePriority <= rightChildQueuePriority) {
      await this.swapPositionsInPriorityQueue({
        transaction,
        firstQueue: queue,
        secondQueue: leftChildQueue
      });

      await this.repairDown({ transaction, discriminator: queue.discriminator });
    } else {
      await this.swapPositionsInPriorityQueue({
        transaction,
        firstQueue: queue,
        secondQueue: rightChildQueue!
      });

      await this.repairDown({ transaction, discriminator: queue.discriminator });
    }
  }

  protected async removeQueueInternal ({ transaction, discriminator }: {
    transaction: Transaction;
    discriminator: string;
  }): Promise<void> {
    const requestOne = transaction.request();

    requestOne.input('discriminator', Types.NVarChar, discriminator);

    const { recordset } = await requestOne.query(`
      SELECT [indexInPriorityQueue]
        FROM [${this.tableNames.priorityQueue}]
        WHERE [discriminator] = @discriminator;
    `);

    if (recordset.length === 0) {
      throw new errors.ItemNotFound();
    }

    const requestTwo = transaction.request();

    requestTwo.input('discriminator', Types.NVarChar, discriminator);

    await requestTwo.query(`
      DELETE
        FROM [${this.tableNames.priorityQueue}]
        WHERE [discriminator] = @discriminator;
    `);

    const requestThree = transaction.request();

    const { recordset: [{ count }] } = await requestThree.query(`
      SELECT count(*) as count
        FROM [${this.tableNames.priorityQueue}];
    `);

    if (recordset[0].indexInPriorityQueue >= count) {
      return;
    }

    const requestFour = transaction.request();

    requestFour.input('index', Types.Int, recordset[0].indexInPriorityQueue);
    requestFour.input('lastIndex', Types.Int, count);
    await requestFour.query(`
      UPDATE [${this.tableNames.priorityQueue}]
        SET [indexInPriorityQueue] = @index
        WHERE [indexInPriorityQueue] = @lastIndex;
    `);

    const requestFive = transaction.request();

    requestFive.input('index', Types.Int, recordset[0].indexInPriorityQueue);
    const { recordset: [{ discriminator: movedQueueDiscriminator }] } = await requestFive.query(`
      SELECT [discriminator]
        FROM [${this.tableNames.priorityQueue}]
        WHERE [indexInPriorityQueue] = @index;
    `);

    await this.repairDown({ transaction, discriminator: movedQueueDiscriminator });
  }

  protected async getQueueByDiscriminator ({ transaction, discriminator }: {
    transaction: Transaction;
    discriminator: string;
  }): Promise<Queue | undefined> {
    const request = transaction.request();

    request.input('discriminator', Types.NVarChar, discriminator);

    const { recordset } = await request.query(`
      SELECT
          [pq].[indexInPriorityQueue] AS [indexInPriorityQueue],
          [i].[priority] AS [priority],
          [pq].[lockUntil] AS [lockUntil],
          CASE WHEN [pq].[lockToken] IS NULL THEN NULL ELSE [pq].[lockToken] END AS [lockToken]
        FROM [${this.tableNames.priorityQueue}] AS [pq]
        JOIN [${this.tableNames.items}] AS [i]
          ON [pq].[discriminator] = [i].[discriminator]
        WHERE [pq].[discriminator] = @discriminator
          AND [i].[indexInQueue] = 0;
    `);

    if (recordset.length === 0) {
      return;
    }

    const queue: Queue = {
      discriminator,
      index: recordset[0].indexInPriorityQueue,
      priority: recordset[0].priority
    };

    if (recordset[0].lockUntil) {
      queue.lock = {
        until: recordset[0].lockUntil,
        token: recordset[0].lockToken.toLowerCase()
      };
    }

    return queue;
  }

  protected async getQueueByIndexInPriorityQueue ({ transaction, indexInPriorityQueue }: {
    transaction: Transaction;
    indexInPriorityQueue: number;
  }): Promise<Queue | undefined> {
    const request = transaction.request();

    request.input('indexInPriorityQueue', Types.Int, indexInPriorityQueue);

    const { recordset } = await request.query(`
      SELECT
          [pq].[discriminator] AS [discriminator],
          [i].[priority] AS [priority],
          [pq].[lockUntil] AS [lockUntil],
          CASE WHEN [pq].[lockToken] IS NULL THEN NULL ELSE [pq].[lockToken] END AS [lockToken]
        FROM [${this.tableNames.priorityQueue}] AS [pq]
        JOIN [${this.tableNames.items}] AS [i]
          ON [pq].[discriminator] = [i].[discriminator]
        WHERE [pq].[indexInPriorityQueue] = @indexInPriorityQueue
          AND [i].[indexInQueue] = 0;
    `);

    if (recordset.length === 0) {
      return;
    }

    const queue: Queue = {
      discriminator: recordset[0].discriminator,
      index: indexInPriorityQueue,
      priority: recordset[0].priority
    };

    if (recordset[0].lockUntil) {
      queue.lock = {
        until: recordset[0].lockUntil,
        token: recordset[0].lockToken.toLowerCase()
      };
    }

    return queue;
  }

  protected async getFirstItemInQueue ({ transaction, discriminator }: {
    transaction: Transaction;
    discriminator: string;
  }): Promise<TItem> {
    const request = transaction.request();

    request.input('discriminator', Types.NVarChar, discriminator);

    const { recordset } = await request.query(`
      SELECT TOP 1 [item]
        FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator
        ORDER BY [indexInQueue] ASC;
    `);

    if (recordset.length === 0) {
      throw new errors.InvalidOperation();
    }

    return JSON.parse(recordset[0].item);
  }

  protected async getQueueIfLocked ({ transaction, discriminator, token }: {
    transaction: Transaction;
    discriminator: string;
    token: string;
  }): Promise<Queue> {
    const queue = await this.getQueueByDiscriminator({ transaction, discriminator });

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

  protected async enqueueInternal ({ transaction, item, discriminator, priority }: {
    transaction: Transaction;
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    const requestGetNextIndexInQueue = transaction.request();

    requestGetNextIndexInQueue.input('discriminator', Types.NVarChar, discriminator);

    const { recordset: [{ nextIndexInQueue }] } = await requestGetNextIndexInQueue.query(`
      SELECT COALESCE(MAX([indexInQueue]) + 1, 0) AS [nextIndexInQueue]
        FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator;
    `);

    const requestInsertItem = transaction.request();

    requestInsertItem.input('discriminator', Types.NVarChar, discriminator);
    requestInsertItem.input('indexInQueue', Types.Int, nextIndexInQueue);
    requestInsertItem.input('priority', Types.BigInt, priority);
    requestInsertItem.input('item', Types.NVarChar, JSON.stringify(item));

    await requestInsertItem.query(`
      INSERT
        INTO [${this.tableNames.items}] ([discriminator], [indexInQueue], [priority], [item])
        VALUES (@discriminator, @indexInQueue, @priority, @item);
    `);

    try {
      const requestGetNextIndexInPriorityQueue = transaction.request();

      const { recordset: [{ nextIndexInPriorityQueue }] } = await requestGetNextIndexInPriorityQueue.query(`
        SELECT COALESCE(MAX([indexInPriorityQueue]) + 1, 0) AS [nextIndexInPriorityQueue]
          FROM [${this.tableNames.priorityQueue}];
      `);

      const requestInsertPriorityQueue = transaction.request();

      requestInsertPriorityQueue.input('discriminator', Types.NVarChar, discriminator);
      requestInsertPriorityQueue.input('indexInPriorityQueue', Types.Int, nextIndexInPriorityQueue);

      await requestInsertPriorityQueue.query(`
        INSERT
          INTO [${this.tableNames.priorityQueue}] ([discriminator], [indexInPriorityQueue])
          VALUES (@discriminator, @indexInPriorityQueue);
      `);
    } catch (ex: unknown) {
      if (
        ex instanceof RequestError &&
        ex.code === 'EREQUEST' &&
        ex.number === 2627 &&
        ex.message.startsWith('Violation of PRIMARY KEY constraint')
      ) {
        return;
      }

      throw ex;
    }

    await this.repairUp({ transaction, discriminator });
  }

  public async enqueue ({ item, discriminator, priority }: {
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        const transaction = this.pool.transaction();

        await transaction.begin();

        try {
          await this.enqueueInternal({ transaction, item, discriminator, priority });
          await transaction.commit();
        } catch (ex: unknown) {
          await transaction.rollback();
          throw ex;
        }
      }
    );
  }

  protected async lockNextInternal ({ transaction }: {
    transaction: Transaction;
  }): Promise<{ item: TItem; metadata: LockMetadata } | undefined> {
    const requestSelect = transaction.request();

    requestSelect.input('now', Types.BigInt, Date.now());

    const { recordset } = await requestSelect.query(`
      SELECT TOP 1 [discriminator] FROM [${this.tableNames.priorityQueue}]
        WHERE [lockUntil] IS NULL
           OR [lockUntil] <= @now
        ORDER BY [indexInPriorityQueue] ASC;
    `);

    if (recordset.length === 0) {
      return;
    }

    const { discriminator } = recordset[0];

    const item = await this.getFirstItemInQueue({ transaction, discriminator });

    const until = Date.now() + this.expirationTime;
    const token = v4();

    const requestUpdate = transaction.request();

    requestUpdate.input('until', Types.BigInt, until);
    requestUpdate.input('token', Types.UniqueIdentifier, token);
    requestUpdate.input('discriminator', Types.NVarChar, discriminator);

    await requestUpdate.query(`
      UPDATE [${this.tableNames.priorityQueue}]
        SET [lockUntil] = @until, [lockToken] = @token
        WHERE [discriminator] = @discriminator
    `);

    await this.repairDown({ transaction, discriminator });

    return { item, metadata: { discriminator, token }};
  }

  public async lockNext (): Promise<{ item: TItem; metadata: LockMetadata } | undefined> {
    return await this.functionCallQueue.add(
      async (): Promise<{ item: TItem; metadata: LockMetadata } | undefined> => {
        const transaction = this.pool.transaction();
        let nextItem: { item: TItem; metadata: LockMetadata } | undefined;

        await transaction.begin();

        try {
          nextItem = await this.lockNextInternal({ transaction });
          await transaction.commit();
        } catch (ex: unknown) {
          await transaction.rollback();
          throw ex;
        }

        return nextItem;
      }
    );
  }

  protected async renewLockInternal ({ transaction, discriminator, token }: {
    transaction: Transaction;
    discriminator: string;
    token: string;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ transaction, discriminator, token });
    const newUntil = Date.now() + this.expirationTime;

    const request = transaction.request();

    request.input('newUntil', Types.BigInt, newUntil);
    request.input('discriminator', Types.NVarChar, discriminator);

    await request.query(`
      UPDATE [${this.tableNames.priorityQueue}]
        SET [lockUntil] = @newUntil
        WHERE [discriminator] = @discriminator;
    `);

    await this.repairDown({ transaction, discriminator: queue.discriminator });
  }

  public async renewLock ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        const transaction = this.pool.transaction();

        await transaction.begin();

        try {
          await this.renewLockInternal({ transaction, discriminator, token });
          await transaction.commit();
        } catch (ex: unknown) {
          await transaction.rollback();
          throw ex;
        }
      }
    );
  }

  protected async acknowledgeInternal ({ transaction, discriminator, token }: {
    transaction: Transaction;
    discriminator: string;
    token: string;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ transaction, discriminator, token });

    const requestDelete = transaction.request();

    requestDelete.input('discriminator', Types.NVarChar, queue.discriminator);

    const { rowsAffected } = await requestDelete.query(`
      DELETE FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator
          AND [indexInQueue] = 0;
      UPDATE [${this.tableNames.items}]
        SET [indexInQueue] = [indexInQueue] - 1
        WHERE [discriminator] = @discriminator;
    `);

    if (rowsAffected[1] > 0) {
      // If the indexes of any item were changed, i.e. if there are still items
      // in the queue...
      const requestUpdate = transaction.request();

      requestUpdate.input('discriminator', Types.NVarChar, queue.discriminator);

      await requestUpdate.query(`
        UPDATE [${this.tableNames.priorityQueue}]
          SET [lockUntil] = NULL, [lockToken] = NULL
          WHERE [discriminator] = @discriminator;
      `);

      await this.repairDown({ transaction, discriminator: queue.discriminator });

      return;
    }

    await this.removeQueueInternal({ transaction, discriminator: queue.discriminator });
  }

  public async acknowledge ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        const transaction = this.pool.transaction();

        await transaction.begin();

        try {
          await this.acknowledgeInternal({ transaction, discriminator, token });
          await transaction.commit();
        } catch (ex: unknown) {
          await transaction.rollback();
          throw ex;
        }
      }
    );
  }

  protected async deferInternal ({ transaction, discriminator, token, priority }: {
    transaction: Transaction;
    discriminator: string;
    token: string;
    priority: number;
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({ transaction, discriminator, token });

    const item = await this.getFirstItemInQueue({ transaction, discriminator: queue.discriminator });

    await this.acknowledgeInternal({ transaction, discriminator: queue.discriminator, token });
    await this.enqueueInternal({ transaction, item, discriminator: queue.discriminator, priority });
  }

  public async defer ({ discriminator, token, priority }: {
    discriminator: string;
    token: string;
    priority: number;
  }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        const transaction = this.pool.transaction();

        await transaction.begin();

        try {
          await this.deferInternal({ transaction, discriminator, token, priority });
          await transaction.commit();
        } catch (ex: unknown) {
          await transaction.rollback();
          throw ex;
        }
      }
    );
  }

  public async removeInternal ({ transaction, discriminator, itemIdentifier }: {
    transaction: Transaction;
    discriminator: string;
    itemIdentifier: TItemIdentifier;
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({ transaction, discriminator });

    if (!queue) {
      throw new errors.ItemNotFound();
    }

    const getItemsRequest = transaction.request();

    getItemsRequest.input('discriminator', Types.NVarChar, discriminator);

    const { recordset } = await getItemsRequest.query(`
      SELECT [item]
        FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator
        ORDER BY [indexInQueue] ASC;
    `);

    const items = recordset.map(({ item }: { item: string }): TItem => JSON.parse(item));

    const foundItemIndex = items.findIndex((item: TItem): boolean => this.doesIdentifierMatchItem({ item, itemIdentifier }));

    if (foundItemIndex === -1) {
      throw new errors.ItemNotFound();
    }

    if (foundItemIndex === 0) {
      if (queue.lock && queue.lock.until > Date.now()) {
        throw new errors.ItemNotFound();
      }

      if (items.length === 1) {
        await this.removeQueueInternal({ transaction, discriminator });

        return;
      }

      const removeItemRequest = transaction.request();

      removeItemRequest.input('discriminator', Types.NVarChar, discriminator);

      await removeItemRequest.query(`
        DELETE
          FROM [${this.tableNames.items}]
          WHERE [discriminator] = @discriminator
            AND [indexInQueue] = 0;
        UPDATE [${this.tableNames.items}]
          SET [indexInQueue] = [indexInQueue] - 1
          WHERE [discriminator] = @discriminator;
      `);

      await this.repairDown({ transaction, discriminator: queue.discriminator });
      await this.repairUp({ transaction, discriminator: queue.discriminator });

      return;
    }

    const removeItemRequest = transaction.request();

    removeItemRequest.input('discriminator', Types.NVarChar, discriminator);
    removeItemRequest.input('indexInQueue', Types.Int, foundItemIndex);

    await removeItemRequest.query(`
      DELETE
        FROM [${this.tableNames.items}]
        WHERE [discriminator] = @discriminator
          AND [indexInQueue] = @indexInQueue;
      UPDATE [${this.tableNames.items}]
        SET [indexInQueue] = [indexInQueue] - 1
        WHERE [discriminator] = @discriminator
          AND [indexInQueue] > @indexInQueue;
    `);
  }

  public async remove ({ discriminator, itemIdentifier }: { discriminator: string; itemIdentifier: TItemIdentifier }): Promise<void> {
    await this.functionCallQueue.add(
      async (): Promise<void> => {
        const transaction = this.pool.transaction();

        await transaction.begin();

        try {
          await this.removeInternal({ transaction, discriminator, itemIdentifier });
          await transaction.commit();
        } catch (ex: unknown) {
          await transaction.rollback();
          throw ex;
        }
      }
    );
  }

  public async setup (): Promise<void> {
    try {
      await this.pool.query(`
        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.items}')
          BEGIN
            CREATE TABLE [${this.tableNames.items}] (
              [discriminator] NVARCHAR(100) NOT NULL,
              [indexInQueue] INT NOT NULL,
              [priority] BIGINT NOT NULL,
              [item] NVARCHAR(4000) NOT NULL,

              CONSTRAINT [${this.tableNames.items}_pk] PRIMARY KEY([discriminator], [indexInQueue])
            );

            CREATE INDEX [${this.tableNames.items}_idx_discriminator]
              ON [${this.tableNames.items}] ([discriminator]);
          END

        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.priorityQueue}')
          BEGIN
            CREATE TABLE [${this.tableNames.priorityQueue}] (
              [discriminator] NVARCHAR(100) NOT NULL,
              [indexInPriorityQueue] INT NOT NULL,
              [lockUntil] BIGINT,
              [lockToken] UNIQUEIDENTIFIER,

              CONSTRAINT [${this.tableNames.priorityQueue}_pk] PRIMARY KEY([discriminator])
            );

            CREATE UNIQUE INDEX [${this.tableNames.priorityQueue}_idx_indexInPriorityQueue]
              ON [${this.tableNames.priorityQueue}] ([indexInPriorityQueue]);
          END
      `);
    } catch (ex: unknown) {
      if (!(ex as Error).message.includes('There is already an object named')) {
        throw ex;
      }

      // When multiple clients initialize at the same time, e.g. during
      // integration tests, SQL Server might throw an error. In this case we
      // simply ignore it
    }
  }

  public async destroy (): Promise<void> {
    await this.pool.close();
  }
}

export { SqlServerPriorityQueueStore };
