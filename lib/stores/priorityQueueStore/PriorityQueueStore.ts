import { LockMetadata } from './LockMetadata';

// The priority queues implementing this interface are based on a heap data
// structure, where items with smaller priorities move closer to the root node.
// Hence, this represents a min-heap.
export interface PriorityQueueStore<TItem, TItemIdentifier> {
  enqueue ({ item, discriminator, priority }: {
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void>;

  lockNext (): Promise<{
    item: TItem;
    metadata: LockMetadata;
  } | undefined>;

  renewLock ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void>;

  acknowledge ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void>;

  defer ({ discriminator, token, priority }: {
    discriminator: string;
    token: string;
    priority: number;
  }): Promise<void>;

  remove ({ discriminator, itemIdentifier }: {
    discriminator: string;
    itemIdentifier: TItemIdentifier;
  }): Promise<void>;

  destroy (): Promise<void>;
}
