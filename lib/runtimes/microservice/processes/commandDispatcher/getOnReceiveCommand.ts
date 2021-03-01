import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const getOnReceiveCommand = function ({
  priorityQueueStore,
  newCommandPublisher,
  newCommandPubSubChannel
}: {
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
  newCommandPublisher: Publisher<object>;
  newCommandPubSubChannel: string;
}): OnReceiveCommand {
  return async function ({ command }): Promise<void> {
    try {
      logger.debug(
        'Enqueueing command in priority queue...',
        withLogMetadata('runtime', 'microservice/commandDispatcher', { command })
      );

      await priorityQueueStore.enqueue({
        item: command,
        discriminator: command.aggregateIdentifier.aggregate.id,
        priority: command.metadata.timestamp
      });
      await newCommandPublisher.publish({
        channel: newCommandPubSubChannel,
        message: {}
      });

      logger.debug(
        'Enqueued command in priority queue.',
        withLogMetadata('runtime', 'microservice/commandDispatcher', { command })
      );
    } catch (ex: unknown) {
      logger.error(
        'Failed to enqueue command in priority queue.',
        withLogMetadata(
          'runtime',
          'microservice/commandDispatcher',
          { command, error: ex }
        )
      );

      throw new errors.RequestFailed('Failed to enqueue command in priority queue.', {
        cause: ex,
        data: { command }
      });
    }
  };
};

export { getOnReceiveCommand };
