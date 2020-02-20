'use strict';

const sampleProjection = {
  selector: 'sampleContext.sampleAggregate.sampleDomainEvent',

  async handle (sampleViewItems, domainEvent) {
    const aggregateId = domainEvent.aggregateIdentifier.id;

    const sampleItem = sampleViewItems.find((sampleItem) => sampleItem.id === aggregateId);

    if (!sampleItem) {
      sampleViewItems.push({
        id: aggregateId,
        createdAt: domainEvent.metadata.timestamp
      });

      return;
    }

    sampleItem.updatedAt = domainEvent.metadata.timestamp;
  }
};

module.exports = { sampleProjection };
