import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
import { LockMetadata } from '../LockMetadata';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { SqlServerPriorityQueueStoreOptions } from './SqlServerPriorityQueueStoreOptions';
import { TableNames } from './TableNames';
import { ConnectionPool, Transaction } from 'mssql';
declare class SqlServerPriorityQueueStore<TItem extends object, TItemIdentifier> implements PriorityQueueStore<TItem, TItemIdentifier> {
    protected tableNames: TableNames;
    protected pool: ConnectionPool;
    protected doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    protected expirationTime: number;
    protected functionCallQueue: PQueue;
    protected static getPriority({ queue }: {
        queue: Queue;
    }): number;
    protected static onUnexpectedClose(): never;
    protected constructor({ tableNames, pool, doesIdentifierMatchItem, expirationTime }: {
        tableNames: TableNames;
        pool: ConnectionPool;
        doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
        expirationTime: number;
    });
    static create<TCreateItem extends object, TCreateItemIdentifier>({ doesIdentifierMatchItem, expirationTime, hostName, port, userName, password, database, tableNames, encryptConnection }: SqlServerPriorityQueueStoreOptions<TCreateItem, TCreateItemIdentifier>): Promise<SqlServerPriorityQueueStore<TCreateItem, TCreateItemIdentifier>>;
    protected swapPositionsInPriorityQueue({ transaction, firstQueue, secondQueue }: {
        transaction: Transaction;
        firstQueue: Queue;
        secondQueue: Queue;
    }): Promise<void>;
    protected repairUp({ transaction, discriminator }: {
        transaction: Transaction;
        discriminator: string;
    }): Promise<void>;
    protected repairDown({ transaction, discriminator }: {
        transaction: Transaction;
        discriminator: string;
    }): Promise<void>;
    protected removeQueueInternal({ transaction, discriminator }: {
        transaction: Transaction;
        discriminator: string;
    }): Promise<void>;
    protected getQueueByDiscriminator({ transaction, discriminator }: {
        transaction: Transaction;
        discriminator: string;
    }): Promise<Queue | undefined>;
    protected getQueueByIndexInPriorityQueue({ transaction, indexInPriorityQueue }: {
        transaction: Transaction;
        indexInPriorityQueue: number;
    }): Promise<Queue | undefined>;
    protected getFirstItemInQueue({ transaction, discriminator }: {
        transaction: Transaction;
        discriminator: string;
    }): Promise<TItem>;
    protected getQueueIfLocked({ transaction, discriminator, token }: {
        transaction: Transaction;
        discriminator: string;
        token: string;
    }): Promise<Queue>;
    protected enqueueInternal({ transaction, item, discriminator, priority }: {
        transaction: Transaction;
        item: TItem;
        discriminator: string;
        priority: number;
    }): Promise<void>;
    enqueue({ item, discriminator, priority }: {
        item: TItem;
        discriminator: string;
        priority: number;
    }): Promise<void>;
    protected lockNextInternal({ transaction }: {
        transaction: Transaction;
    }): Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    lockNext(): Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    protected renewLockInternal({ transaction, discriminator, token }: {
        transaction: Transaction;
        discriminator: string;
        token: string;
    }): Promise<void>;
    renewLock({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    protected acknowledgeInternal({ transaction, discriminator, token }: {
        transaction: Transaction;
        discriminator: string;
        token: string;
    }): Promise<void>;
    acknowledge({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    protected deferInternal({ transaction, discriminator, token, priority }: {
        transaction: Transaction;
        discriminator: string;
        token: string;
        priority: number;
    }): Promise<void>;
    defer({ discriminator, token, priority }: {
        discriminator: string;
        token: string;
        priority: number;
    }): Promise<void>;
    removeInternal({ transaction, discriminator, itemIdentifier }: {
        transaction: Transaction;
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
export { SqlServerPriorityQueueStore };
