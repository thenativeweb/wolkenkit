import CommandInternal from '../../common/elements/CommandInternal';

export interface Queuestore {
  enqueueItem: ({ item }: {
    item: CommandInternal;
  }) => Promise<void>;

  getNextUnprocessedItem: () => Promise<{
    unprocessedItem: CommandInternal;
    token: string;
  }>;

  extendItemProcessingTime: ({ item, token }: {
    item: CommandInternal;
    token: string;
  }) => Promise<void>;

  dequeueItem: ({ item, token }: {
    item: CommandInternal;
    token: string;
  }) => Promise<void>;

  destroy: () => Promise<void>;
}
