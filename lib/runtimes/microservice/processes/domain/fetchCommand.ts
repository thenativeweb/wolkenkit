import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { retry } from 'retry-ignore-abort';

const fetchCommand = async function ({ commandDispatcher }: {
  commandDispatcher: CommandDispatcher;
}): Promise<{
    command: CommandWithMetadata<CommandData>;
    token: string;
  }> {
  const { item, token } = await retry(
    async (): Promise<{
      item: CommandWithMetadata<CommandData>;
      token: string;
    }> => await commandDispatcher.client.awaitCommandWithMetadata(),
    { retries: Number.POSITIVE_INFINITY, maxTimeout: 1000 }
  );

  return { command: item, token };
};

export {
  fetchCommand
};
