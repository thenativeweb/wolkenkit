import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';

const shouldRetryCommand = async function ({ command, applicationDefinition }: {
  command: CommandWithMetadata<CommandData>;
  applicationDefinition: ApplicationDefinition;
}): Promise<boolean> {
  const commandHandler = applicationDefinition.domain[command.contextIdentifier.name][command.aggregateIdentifier.name].commandHandlers[command.name];

  // eslint-disable-next-line @typescript-eslint/unbound-method
  if (!commandHandler.retry) {
    return true;
  }

  const retry = await commandHandler.retry();

  return retry;
};

export { shouldRetryCommand };
