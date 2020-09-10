import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { retry } from 'retry-ignore-abort';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const acknowledgeCommand = async function ({ command, token, commandDispatcher }: {
  command: CommandWithMetadata<CommandData>;
  token: string;
  commandDispatcher: CommandDispatcher;
}): Promise<void> {
  logger.debug(
    'Acknowledging command...',
    withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token }})
  );

  try {
    await retry(async (): Promise<void> => {
      await commandDispatcher.client.acknowledge({
        discriminator: command.aggregateIdentifier.aggregate.id,
        token
      });
    }, { retries: commandDispatcher.acknowledgeRetries, maxTimeout: 1_000 });

    logger.debug(
      'Acknowledged command.',
      withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token }})
    );
  } catch (ex: unknown) {
    logger.debug(
      'Failed to acknowledge command.',
      withLogMetadata('runtime', 'microservice/domain', { err: ex })
    );

    throw ex;
  }
};

export {
  acknowledgeCommand
};
