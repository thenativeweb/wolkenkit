'use strict';

const sampleHandler = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  handle (domainEvent, { logger }) {
    logger.info('Received domain event.', { domainEvent });
  }
};

module.exports = { sampleHandler };
