'use strict';

const handleMessageSent = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'communication.message.sent';
  },

  async handle (domainEvent, { infrastructure, notification }) {
    const message = {
      id: domainEvent.aggregateIdentifier.aggregate.id,
      timestamp: domainEvent.metadata.timestamp,
      text: domainEvent.data.text,
      likes: 0
    };

    if (Array.isArray(infrastructure.tell.viewStore.messages)) {
      infrastructure.tell.viewStore.messages.push(message);

      await notification.publish('flowMessagesUpdated', {});

      return;
    }

    await infrastructure.tell.viewStore.messages.insertOne(message);

    await notification.publish('flowMessagesUpdated', {});
  }
};

module.exports = { handleMessageSent };
