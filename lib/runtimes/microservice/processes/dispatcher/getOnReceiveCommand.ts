import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';

const logger = flaschenpost.getLogger();

const getOnReceiveCommand = function ({ priorityQueueStore }: {
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
}): OnReceiveCommand {
  return async function ({ command }): Promise<void> {
    logger.debug('Received command, enqueueing it.', { command });

    await priorityQueueStore.enqueue({ item: command });
  };
};

export { getOnReceiveCommand };
