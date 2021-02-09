import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';

const logger = flaschenpost.getLogger();

const getOnCancelCommand = function ({ priorityQueueStore }: {
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
}): OnCancelCommand {
  return async function ({ commandIdentifierWithClient }): Promise<void> {
    await priorityQueueStore.remove({
      itemIdentifier: commandIdentifierWithClient,
      discriminator: commandIdentifierWithClient.aggregateIdentifier.aggregate.id
    });

    logger.debug('Cancelled command by removing it from the priority queue.', { commandIdentifierWithClient });
  };
};

export { getOnCancelCommand };
