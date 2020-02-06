import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Dispatcher } from './Dispatcher';
import { retry } from 'retry-ignore-abort';

const fetchCommand = async function ({ dispatcher }: {
  dispatcher: Dispatcher;
}): Promise<{
    command: CommandWithMetadata<CommandData>;
    token: string;
  }> {
  const { item, token } = await retry(
    async (): Promise<{
      item: CommandWithMetadata<CommandData>;
      token: string;
    }> => await dispatcher.client.awaitCommandWithMetadata(),
    { retries: Number.POSITIVE_INFINITY, maxTimeout: 1000 }
  );

  return { command: item, token };
};

export {
  fetchCommand
};
