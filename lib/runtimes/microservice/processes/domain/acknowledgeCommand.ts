import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Dispatcher } from './Dispatcher';
import { retry } from 'retry-ignore-abort';

const acknowledgeCommand = async function ({ command, token, defer, dispatcher }: {
  command: CommandWithMetadata<CommandData>;
  token: string;
  defer?: boolean;
  dispatcher: Dispatcher;
}): Promise<void> {
  await retry(async (): Promise<void> => {
    await dispatcher.client.acknowledge({
      itemIdentifier: command.getItemIdentifier(),
      token,
      defer
    });
  }, { retries: dispatcher.acknowledgeRetries, maxTimeout: 1000 });
};

export {
  acknowledgeCommand
};
