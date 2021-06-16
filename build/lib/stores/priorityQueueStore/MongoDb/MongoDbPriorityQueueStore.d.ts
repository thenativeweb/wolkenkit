import { CollectionNames } from './CollectionNames';
import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
import { LockMetadata } from '../LockMetadata';
import { MongoDbPriorityQueueStoreOptions } from './MongDbPriorityQueueStoreOptions';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
import { ClientSession, Collection, Db, MongoClient } from 'mongodb';
declare class MongoDbPriorityQueueStore<TItem extends object, TItemIdentifier> implements PriorityQueueStore<TItem, TItemIdentifier> {
    protected client: MongoClient;
    protected db: Db;
    protected collectionNames: CollectionNames;
    protected collections: {
        queues: Collection<any>;
    };
    protected doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    protected expirationTime: number;
    protected functionCallQueue: PQueue;
    protected static getPriority<TGetPriorityItem>({ queue }: {
        queue: Queue<TGetPriorityItem>;
    }): number;
    protected static onUnexpectedClose(): never;
    protected constructor({ client, db, collectionNames, collections, doesIdentifierMatchItem, expirationTime }: {
        client: MongoClient;
        db: Db;
        collectionNames: CollectionNames;
        collections: {
            queues: Collection<any>;
        };
        doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
        expirationTime: number;
    });
    static create<TCreateItem extends object, TCreateItemIdentifier>({ doesIdentifierMatchItem, expirationTime, connectionString, collectionNames }: MongoDbPriorityQueueStoreOptions<TCreateItem, TCreateItemIdentifier>): Promise<MongoDbPriorityQueueStore<TCreateItem, TCreateItemIdentifier>>;
    protected swapPositionsInPriorityQueue({ session, firstQueue, secondQueue }: {
        session: ClientSession;
        firstQueue: Queue<TItem>;
        secondQueue: Queue<TItem>;
    }): Promise<void>;
    protected repairUp({ session, discriminator }: {
        session: ClientSession;
        discriminator: string;
    }): Promise<void>;
    protected repairDown({ session, discriminator }: {
        session: ClientSession;
        discriminator: string;
    }): Promise<void>;
    protected removeQueueInternal({ session, discriminator }: {
        session: ClientSession;
        discriminator: string;
    }): Promise<void>;
    protected getQueueByDiscriminator({ session, discriminator }: {
        session: ClientSession;
        discriminator: string;
    }): Promise<Queue<TItem> | undefined>;
    protected getQueueByIndexInPriorityQueue({ session, indexInPriorityQueue }: {
        session: ClientSession;
        indexInPriorityQueue: number;
    }): Promise<Queue<TItem> | undefined>;
    protected getQueueIfLocked({ session, discriminator, token }: {
        session: ClientSession;
        discriminator: string;
        token: string;
    }): Promise<Queue<TItem>>;
    protected enqueueInternal({ session, item, discriminator, priority }: {
        session: ClientSession;
        item: TItem;
        discriminator: string;
        priority: number;
    }): Promise<void>;
    enqueue({ item, discriminator, priority }: {
        item: TItem;
        discriminator: string;
        priority: number;
    }): Promise<void>;
    protected lockNextInternal({ session }: {
        session: ClientSession;
    }): Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    lockNext(): Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    protected renewLockInternal({ session, discriminator, token }: {
        session: ClientSession;
        discriminator: string;
        token: string;
    }): Promise<void>;
    renewLock({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    protected acknowledgeInternal({ session, discriminator, token }: {
        session: ClientSession;
        discriminator: string;
        token: string;
    }): Promise<void>;
    acknowledge({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    protected deferInternal({ session, discriminator, token, priority }: {
        session: ClientSession;
        discriminator: string;
        token: string;
        priority: number;
    }): Promise<void>;
    defer({ discriminator, token, priority }: {
        discriminator: string;
        token: string;
        priority: number;
    }): Promise<void>;
    protected removeInternal({ session, discriminator, itemIdentifier }: {
        session: ClientSession;
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
export { MongoDbPriorityQueueStore };
