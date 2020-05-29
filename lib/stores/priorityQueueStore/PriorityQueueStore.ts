// The priority queues implementing this interface are based on a heap data
// structure, where items with smaller priorities tend to become closer to the
// root node. Hence, this represents a min-heap.
export interface PriorityQueueStore<TItem> {
  enqueue ({ item, discriminator, priority }: {
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void>;

  lockNext (): Promise<{ item: TItem; token: string } | undefined>;

  renewLock ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void>;

  acknowledge ({ discriminator, token }: {
    discriminator: string;
    token: string;
  }): Promise<void>;

  destroy (): Promise<void>;
}
