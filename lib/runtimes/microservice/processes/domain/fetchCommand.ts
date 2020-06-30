import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { LockMetadata } from '../../../../stores/priorityQueueStore/LockMetadata';
import { retry } from 'retry-ignore-abort';

const fetchCommand = async function ({ commandDispatcher }: {
  commandDispatcher: CommandDispatcher;
}): Promise<{
    command: CommandWithMetadata<CommandData>;
    token: string;
  }> {
  const { item, metadata } = await retry(
    async (): Promise<{
      item: CommandWithMetadata<CommandData>;
      metadata: LockMetadata;
    }> => await commandDispatcher.client.awaitItem(),
    { retries: Number.POSITIVE_INFINITY, maxTimeout: 1000 }
  );

  return { command: item, token: metadata.token };
};

export {
  fetchCommand
};
