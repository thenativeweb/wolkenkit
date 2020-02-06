import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Dispatcher } from './Dispatcher';
import { retry } from 'retry-ignore-abort';

const acknowledgeCommand = async function ({ command, token, dispatcher }: {
  command: CommandWithMetadata<CommandData>;
  token: string;
  dispatcher: Dispatcher;
}): Promise<void> {
  await retry(async (): Promise<void> => {
    await dispatcher.client.acknowledge({
      itemIdentifier: command.getItemIdentifier(),
      token
    });
  }, { retries: dispatcher.acknowledgeRetries, maxTimeout: 1000 });
};

export {
  acknowledgeCommand
};
