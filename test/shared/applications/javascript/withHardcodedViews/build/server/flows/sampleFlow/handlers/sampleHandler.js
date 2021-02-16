'use strict';

const sampleHandler = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  async handle (domainEvent, { infrastructure, logger, notification }) {
    logger.info('Received domain event.', { domainEvent });

    infrastructure.tell.viewStore.domainEvents.push({
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      name: domainEvent.name,
      id: domainEvent.id
    });

    await notification.publish('flowSampleFlowUpdated', {});
  }
};

module.exports = { sampleHandler };
