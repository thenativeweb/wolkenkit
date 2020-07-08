import { FlowHandler } from 'wolkenkit';
import { Infrastructure } from '../../../infrastructure';
import { LikedData } from '../../../domain/communication/message/domainEvents/liked';

const handleMessageLiked: FlowHandler<LikedData, Infrastructure> = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'communication.message.liked';
  },

  async handle (domainEvent, { infrastructure }) {
    if (Array.isArray(infrastructure.tell.viewStore.messages)) {
      const message = infrastructure.tell.viewStore.messages.find(
        (message): boolean => message.id === domainEvent.aggregateIdentifier.id);

      message.likes = domainEvent.data.likes;

      return;
    }

    await infrastructure.tell.viewStore.messages.updateOne(
      { id: domainEvent.aggregateIdentifier.id },
      { $set: { likes: domainEvent.data.likes }}
    );
  }
};

export { handleMessageLiked };
