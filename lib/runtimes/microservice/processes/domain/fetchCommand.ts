import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { LockMetadata } from '../../../../stores/priorityQueueStore/LockMetadata';
import { retry } from 'retry-ignore-abort';

const fetchCommand = async function ({ commandDispatcher }: {
  commandDispatcher: CommandDispatcher;
}): Promise<{
    command: CommandWithMetadata<CommandData>;
    metadata: LockMetadata;
  }> {
  const { item, metadata } = await retry(
    async (): Promise<{
      item: CommandWithMetadata<CommandData>;
      metadata: LockMetadata;
    }> => await commandDispatcher.client.awaitItem(),
    { retries: Number.POSITIVE_INFINITY, minTimeout: 10, maxTimeout: 1000 }
  );

  return { command: item, metadata };
};

export {
  fetchCommand
};
