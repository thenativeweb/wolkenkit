'use strict';

const liked = {
  selector: 'communication.message.liked',

  async handle (messageItems, domainEvent) {
    const messageItem = messageItems.find(
      messageItem => messageItem.id === domainEvent.aggregateIdentifier.id);

    messageItem.likes = domainEvent.data.likes;
  }
};

module.exports = { liked };
