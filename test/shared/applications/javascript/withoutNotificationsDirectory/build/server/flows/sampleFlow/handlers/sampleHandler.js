'use strict';

const sampleHandler = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  handle (domainEvent, { infrastructure, logger, notification }) {
    logger.info('Received domain event.', { domainEvent });

    infrastructure.tell.viewStore.domainEvents.push({
      contextIdentifier: domainEvent.contextIdentifier,
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      name: domainEvent.name,
      id: domainEvent.id
    });

    notification.publish('flowSampleFlowUpdated', {});
  }
};

module.exports = { sampleHandler };
