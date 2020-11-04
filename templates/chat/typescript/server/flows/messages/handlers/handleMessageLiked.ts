import { FlowHandler } from 'wolkenkit';
import { FlowUpdated } from '../../../notifications/definitions/FlowUpdated';
import { Infrastructure } from '../../../infrastructure';
import { LikedData } from '../../../domain/communication/message/domainEvents/liked';

const handleMessageLiked: FlowHandler<LikedData, Infrastructure> = {
  isRelevant ({ fullyQualifiedName }): boolean {
    return fullyQualifiedName === 'communication.message.liked';
  },

  async handle (domainEvent, { infrastructure, notification }): Promise<void> {
    if (Array.isArray(infrastructure.tell.viewStore.messages)) {
      const messageToUpdate = infrastructure.tell.viewStore.messages.find(
        (message): boolean => message.id === domainEvent.aggregateIdentifier.id
      );

      messageToUpdate!.likes = domainEvent.data.likes;

      await notification.publish<FlowUpdated>('flowMessagesUpdated', {});

      return;
    }

    await infrastructure.tell.viewStore.messages.updateOne(
      { id: domainEvent.aggregateIdentifier.id },
      { $set: { likes: domainEvent.data.likes }}
    );

    await notification.publish<FlowUpdated>('flowMessagesUpdated', {});
  }
};

export { handleMessageLiked };
