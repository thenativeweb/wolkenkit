import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
import { InMemoryPriorityQueueStoreOptions } from './InMemoryPriorityQueueStoreOptions';
import { LockMetadata } from '../LockMetadata';
import PQueue from 'p-queue';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { Queue } from './Queue';
declare class InMemoryPriorityQueueStore<TItem extends object, TItemIdentifier> implements PriorityQueueStore<TItem, TItemIdentifier> {
    protected doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    protected expirationTime: number;
    protected queues: (Queue<TItem> | undefined)[];
    protected index: Map<string, number>;
    protected functionCallQueue: PQueue;
    protected getPriority({ queue }: {
        queue: Queue<TItem>;
    }): number;
    protected constructor({ doesIdentifierMatchItem, options: { expirationTime } }: {
        doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
        options: {
            expirationTime: number;
        };
    });
    static create<TCreateItem extends object, TCreateItemIdentifier>({ doesIdentifierMatchItem, expirationTime }: InMemoryPriorityQueueStoreOptions<TCreateItem, TCreateItemIdentifier>): Promise<InMemoryPriorityQueueStore<TCreateItem, TCreateItemIdentifier>>;
    protected repairUp({ queue }: {
        queue: Queue<TItem>;
    }): void;
    protected repairDown({ queue }: {
        queue: Queue<TItem>;
    }): void;
    protected removeQueueInternal({ discriminator }: {
        discriminator: string;
    }): void;
    protected getQueueIfLocked({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Queue<TItem>;
    protected enqueueInternal({ item, discriminator, priority }: {
        item: TItem;
        discriminator: string;
        priority: number;
    }): void;
    enqueue({ item, discriminator, priority }: {
        item: TItem;
        discriminator: string;
        priority: number;
    }): Promise<void>;
    protected lockNextInternal(): {
        item: TItem;
        metadata: LockMetadata;
    } | undefined;
    lockNext(): Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    protected renewLockInternal({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): void;
    renewLock({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    protected acknowledgeInternal({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): void;
    acknowledge({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    protected deferInternal({ discriminator, token, priority }: {
        discriminator: string;
        token: string;
        priority: number;
    }): void;
    defer({ discriminator, token, priority }: {
        discriminator: string;
        token: string;
        priority: number;
    }): Promise<void>;
    protected removeInternal({ discriminator, itemIdentifier }: {
        discriminator: string;
        itemIdentifier: TItemIdentifier;
    }): Promise<void>;
    remove({ discriminator, itemIdentifier }: {
        discriminator: string;
        itemIdentifier: TItemIdentifier;
    }): Promise<void>;
    setup(): Promise<void>;
    protected destroyInternal(): void;
    destroy(): Promise<void>;
}
export { InMemoryPriorityQueueStore };
