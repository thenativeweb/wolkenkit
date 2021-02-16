'use strict';

const handleMessageLiked = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'communication.message.liked';
  },

  async handle (domainEvent, { infrastructure, notification }) {
    if (Array.isArray(infrastructure.tell.viewStore.messages)) {
      const messageToUpdate = infrastructure.tell.viewStore.messages.find(
        message => message.id === domainEvent.aggregateIdentifier.aggregate.id
      );

      messageToUpdate.likes = domainEvent.data.likes;

      await notification.publish('flowMessagesUpdated', {});

      return;
    }

    await infrastructure.tell.viewStore.messages.updateOne(
      { id: domainEvent.aggregateIdentifier.aggregate.id },
      { $set: { likes: domainEvent.data.likes }}
    );

    await notification.publish('flowMessagesUpdated', {});
  }
};

module.exports = { handleMessageLiked };
