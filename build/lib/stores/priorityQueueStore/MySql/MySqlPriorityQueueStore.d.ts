import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
import { LockMetadata } from '../LockMetadata';
import { MySqlPriorityQueueStoreOptions } from './MySqlPriorityQueueStoreOptions';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { TableNames } from './TableNames';
import { Pool, PoolConnection } from 'mysql';
declare class MySqlPriorityQueueStore<TItem extends object, TItemIdentifier> implements PriorityQueueStore<TItem, TItemIdentifier> {
    protected tableNames: TableNames;
    protected pool: Pool;
    protected doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    protected expirationTime: number;
    protected functionCallQueue: PQueue;
    protected static getPriority({ queue }: {
        queue: Queue;
    }): number;
    protected static onUnexpectedClose(): never;
    protected static releaseConnection({ connection }: {
        connection: PoolConnection;
    }): void;
    protected getDatabase(): Promise<PoolConnection>;
    protected constructor({ tableNames, pool, doesIdentifierMatchItem, expirationTime }: {
        tableNames: TableNames;
        pool: Pool;
        doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
        expirationTime: number;
    });
    static create<TCreateItem extends object, TCreateItemIdentifier>({ doesIdentifierMatchItem, expirationTime, hostName, port, userName, password, database, tableNames }: MySqlPriorityQueueStoreOptions<TCreateItem, TCreateItemIdentifier>): Promise<MySqlPriorityQueueStore<TCreateItem, TCreateItemIdentifier>>;
    protected swapPositionsInPriorityQueue({ connection, firstQueue, secondQueue }: {
        connection: PoolConnection;
        firstQueue: Queue;
        secondQueue: Queue;
    }): Promise<void>;
    protected repairUp({ connection, discriminator }: {
        connection: PoolConnection;
        discriminator: string;
    }): Promise<void>;
    protected repairDown({ connection, discriminator }: {
        connection: PoolConnection;
        discriminator: string;
    }): Promise<void>;
    protected removeQueueInternal({ connection, discriminator }: {
        connection: PoolConnection;
        discriminator: string;
    }): Promise<void>;
    protected getQueueByDiscriminator({ connection, discriminator }: {
        connection: PoolConnection;
        discriminator: string;
    }): Promise<Queue | undefined>;
    protected getQueueByIndexInPriorityQueue({ connection, indexInPriorityQueue }: {
        connection: PoolConnection;
        indexInPriorityQueue: number;
    }): Promise<Queue | undefined>;
    protected getFirstItemInQueue({ connection, discriminator }: {
        connection: PoolConnection;
        discriminator: string;
    }): Promise<TItem>;
    protected getQueueIfLocked({ connection, discriminator, token }: {
        connection: PoolConnection;
        discriminator: string;
        token: string;
    }): Promise<Queue>;
    protected enqueueInternal({ connection, item, discriminator, priority }: {
        connection: PoolConnection;
        item: TItem;
        discriminator: string;
        priority: number;
    }): Promise<void>;
    enqueue({ item, discriminator, priority }: {
        item: TItem;
        discriminator: string;
        priority: number;
    }): Promise<void>;
    protected lockNextInternal({ connection }: {
        connection: PoolConnection;
    }): Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    lockNext(): Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    protected renewLockInternal({ connection, discriminator, token }: {
        connection: PoolConnection;
        discriminator: string;
        token: string;
    }): Promise<void>;
    renewLock({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    protected acknowledgeInternal({ connection, discriminator, token }: {
        connection: PoolConnection;
        discriminator: string;
        token: string;
    }): Promise<void>;
    acknowledge({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    protected deferInternal({ connection, discriminator, token, priority }: {
        connection: PoolConnection;
        discriminator: string;
        token: string;
        priority: number;
    }): Promise<void>;
    defer({ discriminator, token, priority }: {
        discriminator: string;
        token: string;
        priority: number;
    }): Promise<void>;
    protected removeInternal({ connection, discriminator, itemIdentifier }: {
        connection: PoolConnection;
        discriminator: string;
        itemIdentifier: TItemIdentifier;
    }): Promise<void>;
    remove({ discriminator, itemIdentifier }: {
        discriminator: string;
        itemIdentifier: TItemIdentifier;
    }): Promise<void>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { MySqlPriorityQueueStore };
