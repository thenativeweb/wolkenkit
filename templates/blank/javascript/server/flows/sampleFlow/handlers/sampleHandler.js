'use strict';

const sampleHandler = {
  isRelevant () {
    return true;
  },

  async handle (domainEvent, { infrastructure, logger }) {
    logger.info('Received domain event.', { domainEvent });

    if (Array.isArray(infrastructure.tell.viewStore.aggregates)) {
      let aggregateForUpdate = infrastructure.tell.viewStore.aggregates.find(
        aggregate => aggregate.id === domainEvent.aggregateIdentifier.id
      );

      if (aggregateForUpdate) {
        aggregateForUpdate.updatedAt = domainEvent.metadata.timestamp;

        return;
      }

      aggregateForUpdate = {
        id: domainEvent.aggregateIdentifier.id,
        createdAt: domainEvent.metadata.timestamp,
        updatedAt: domainEvent.metadata.timestamp
      };

      infrastructure.tell.viewStore.aggregates.push(aggregateForUpdate);

      return;
    }

    const aggregate = await infrastructure.tell.viewStore.aggregates.findOne(
      { id: domainEvent.aggregateIdentifier.id }
    );

    if (aggregate) {
      await infrastructure.tell.viewStore.aggregates.updateOne(
        { id: domainEvent.aggregateIdentifier.id },
        { $set: { updatedAd: domainEvent.metadata.timestamp }}
      );

      return;
    }

    await infrastructure.tell.viewStore.aggregates.insertOne(
      {
        id: domainEvent.aggregateIdentifier.id,
        createdAt: domainEvent.metadata.timestamp,
        updatedAt: domainEvent.metadata.timestamp
      }
    );
  }
};

module.exports = { sampleHandler };
