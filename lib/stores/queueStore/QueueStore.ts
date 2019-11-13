import { CommandData } from '../../common/elements/CommandData';
import { CommandWithMetadata } from '../../common/elements/CommandWithMetadata';

export interface QueueStore {
  enqueueItem: ({ item }: {
    item: CommandWithMetadata<CommandData>;
  }) => Promise<void>;

  getNextUnprocessedItem: () => Promise<{
    unprocessedItem: CommandWithMetadata<CommandData>;
    token: string;
  }>;

  extendItemProcessingTime: ({ item, token }: {
    item: CommandWithMetadata<CommandData>;
    token: string;
  }) => Promise<void>;

  dequeueItem: ({ item, token }: {
    item: CommandWithMetadata<CommandData>;
    token: string;
  }) => Promise<void>;

  destroy: () => Promise<void>;
}
