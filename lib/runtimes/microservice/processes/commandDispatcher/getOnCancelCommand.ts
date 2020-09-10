import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

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
          { commandIdentifierWithClient, err: ex }
        )
      );

      throw new errors.RequestFailed('Failed to remove command from priority queue.', {
        cause: ex,
        data: { commandIdentifierWithClient }
      });
    }
  };
};

export { getOnCancelCommand };
