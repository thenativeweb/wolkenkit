import { LockMetadata } from './LockMetadata';
export interface PriorityQueueStore<TItem extends object, TItemIdentifier> {
    enqueue: ({ item, discriminator, priority }: {
        item: TItem;
        discriminator: string;
        priority: number;
    }) => Promise<void>;
    lockNext: () => Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    renewLock: ({ discriminator, token }: {
        discriminator: string;
        token: string;
    }) => Promise<void>;
    acknowledge: ({ discriminator, token }: {
        discriminator: string;
        token: string;
    }) => Promise<void>;
    defer: ({ discriminator, token, priority }: {
        discriminator: string;
        token: string;
        priority: number;
    }) => Promise<void>;
    remove: ({ discriminator, itemIdentifier }: {
        discriminator: string;
        itemIdentifier: TItemIdentifier;
    }) => Promise<void>;
    setup: () => Promise<void>;
    destroy: () => Promise<void>;
}
