import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const getOnCancelCommand = function ({ priorityQueueStore }: {
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
}): OnCancelCommand {
  return async function ({ commandIdentifierWithClient }): Promise<void> {
    try {
      logger.debug(
        'Removing command from priority queue...',
        withLogMetadata(
          'runtime',
          'microservice/commandDispatcher',
          { commandIdentifierWithClient }
        )
      );

      await priorityQueueStore.remove({
        itemIdentifier: commandIdentifierWithClient,
        discriminator: commandIdentifierWithClient.aggregateIdentifier.aggregate.id
      });

      logger.debug(
        'Removed command from priority queue.',
        withLogMetadata(
          'runtime',
          'microservice/commandDispatcher',
          { commandIdentifierWithClient }
        )
      );
    } catch (ex: unknown) {
      logger.error(
        'Failed to remove command from priority queue.',
        withLogMetadata(
          'runtime',
          'microservice/commandDispatcher',
          { commandIdentifierWithClient, error: ex }
        )
      );

      throw new errors.RequestFailed({
        message: 'Failed to remove command from priority queue.',
        cause: ex,
        data: { commandIdentifierWithClient }
      });
    }
  };
};

export { getOnCancelCommand };
