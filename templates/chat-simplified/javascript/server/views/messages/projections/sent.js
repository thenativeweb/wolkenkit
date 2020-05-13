'use strict';

const sent = {
  selector: 'communication.message.sent',

  async handle (messageItems, domainEvent) {
    messageItems.push({
      id: domainEvent.aggregateIdentifier.id,
      text: domainEvent.data.text,
      likes: 0,
      timestamp: domainEvent.metadata.timestamp
    });
  }
};

module.exports = { sent };
