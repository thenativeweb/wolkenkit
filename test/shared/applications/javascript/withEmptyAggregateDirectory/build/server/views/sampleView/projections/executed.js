'use strict';

const executed = {
  selector: 'sampleContext.sampleAggregate.executed',

  async handle (sampleItems, domainEvent) {
    const aggregateId = domainEvent.aggregateIdentifier.id;

    const sampleItem = sampleItems.find(item => item.id === aggregateId);

    if (!sampleItem) {
      sampleItems.push({
        id: aggregateId,
        createdAt: domainEvent.metadata.timestamp,
        strategy: domainEvent.data.strategy
      });

      return;
    }

    sampleItem.updatedAt = domainEvent.metadata.timestamp;
  }
};

module.exports = {
  executed
};
