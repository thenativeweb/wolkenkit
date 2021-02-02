import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../messaging/pubSub/Publisher';

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
    logger.debug('Received command, enqueueing it.', { command });

    await priorityQueueStore.enqueue({
      item: command,
      discriminator: command.aggregateIdentifier.aggregate.id,
      priority: command.metadata.timestamp
    });
    await newCommandPublisher.publish({
      channel: newCommandPubSubChannel,
      message: {}
    });
  };
};

export { getOnReceiveCommand };
