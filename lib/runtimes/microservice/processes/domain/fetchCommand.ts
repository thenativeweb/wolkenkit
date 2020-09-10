import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { LockMetadata } from '../../../../stores/priorityQueueStore/LockMetadata';
import { retry } from 'retry-ignore-abort';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const fetchCommand = async function ({ commandDispatcher }: {
  commandDispatcher: CommandDispatcher;
}): Promise<{
    command: CommandWithMetadata<CommandData>;
    metadata: LockMetadata;
  }> {
  logger.debug(
    'Fetching command...',
    withLogMetadata('runtime', 'microservice/domain')
  );

  try {
    const { item, metadata } = await retry(
      async (): Promise<{
        item: CommandWithMetadata<CommandData>;
        metadata: LockMetadata;
      }> => await commandDispatcher.client.awaitItem(),
      { retries: Number.POSITIVE_INFINITY, minTimeout: 10, maxTimeout: 1_000 }
    );

    logger.debug(
      'Fetched command.',
      withLogMetadata('runtime', 'microservice/domain', { command: item, metadata })
    );

    return { command: item, metadata };
  } catch (ex: unknown) {
    logger.debug(
      'Failed to fetch command.',
      withLogMetadata('runtime', 'microservice/domain', { err: ex })
    );

    throw ex;
  }
};

export {
  fetchCommand
};
