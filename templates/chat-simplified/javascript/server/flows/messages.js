'use strict';

const messages = {
  replayPolicy: 'always',

  domainEventHandlers: {
    handleMessageSent: {
      isRelevant ({ fullyQualifiedName }) {
        return fullyQualifiedName === 'communication.message.sent';
      },

      async handle (domainEvent, { infrastructure }) {
        const message = {
          id: domainEvent.aggregateIdentifier.id,
          timestamp: domainEvent.metadata.timestamp,
          text: domainEvent.data.text,
          likes: 0
        };

        if (Array.isArray(infrastructure.tell.viewStore.messages)) {
          infrastructure.tell.viewStore.messages.push(message);

          return;
        }

        await infrastructure.tell.viewStore.messages.insertOne(message);
      }
    },

    handleMessageLiked: {
      isRelevant ({ fullyQualifiedName }) {
        return fullyQualifiedName === 'communication.message.liked';
      },

      async handle (domainEvent, { infrastructure }) {
        if (Array.isArray(infrastructure.tell.viewStore.messages)) {
          const messageToUpdate = infrastructure.tell.viewStore.messages.find(
            message => message.id === domainEvent.aggregateIdentifier.id
          );

          messageToUpdate.likes = domainEvent.data.likes;

          return;
        }

        await infrastructure.tell.viewStore.messages.updateOne(
          { id: domainEvent.aggregateIdentifier.id },
          { $set: { likes: domainEvent.data.likes }}
        );
      }
    }
  }
};

module.exports = messages;
