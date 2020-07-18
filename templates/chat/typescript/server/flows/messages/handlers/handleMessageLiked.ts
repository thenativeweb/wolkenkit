import { FlowHandler } from 'wolkenkit';
import { Infrastructure } from '../../../infrastructure';
import { LikedData } from '../../../domain/communication/message/domainEvents/liked';

const handleMessageLiked: FlowHandler<LikedData, Infrastructure> = {
  isRelevant ({ fullyQualifiedName }): boolean {
    return fullyQualifiedName === 'communication.message.liked';
  },

  async handle (domainEvent, { infrastructure }): Promise<void> {
    if (Array.isArray(infrastructure.tell.viewStore.messages)) {
      const messageToUpdate = infrastructure.tell.viewStore.messages.find(
        (message): boolean => message.id === domainEvent.aggregateIdentifier.id
      );

      messageToUpdate.likes = domainEvent.data.likes;

      return;
    }

    await infrastructure.tell.viewStore.messages.updateOne(
      { id: domainEvent.aggregateIdentifier.id },
      { $set: { likes: domainEvent.data.likes }}
    );
  }
};

export { handleMessageLiked };
