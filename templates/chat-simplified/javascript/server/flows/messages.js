'use strict';

const messages = {
  replayPolicy: 'always',

  domainEventHandlers: {
    handleMessageSent: {
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
    },

    handleMessageLiked: {
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
    }
  }
};

module.exports = messages;
