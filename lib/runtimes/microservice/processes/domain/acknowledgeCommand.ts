import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { retry } from 'retry-ignore-abort';

const acknowledgeCommand = async function ({ command, token, commandDispatcher }: {
  command: CommandWithMetadata<CommandData>;
  token: string;
  commandDispatcher: CommandDispatcher;
}): Promise<void> {
  await retry(async (): Promise<void> => {
    await commandDispatcher.client.acknowledge({
      discriminator: command.aggregateIdentifier.aggregate.id,
      token
    });
  }, { retries: commandDispatcher.acknowledgeRetries, maxTimeout: 1_000 });
};

export {
  acknowledgeCommand
};
