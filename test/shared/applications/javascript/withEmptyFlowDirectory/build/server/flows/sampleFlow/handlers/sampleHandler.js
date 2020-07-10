'use strict';

const sampleHandler = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  handle (domainEvent, { infrastructure, logger }) {
    logger.info('Received domain event.', { domainEvent });

    infrastructure.tell.viewStore.domainEvents.push(domainEvent);
  }
};

module.exports = { sampleHandler };
