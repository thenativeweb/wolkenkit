'use strict';

const sampleHandler = {
  isRelevant () {
    return true;
  },

  async handle (domainEvent, { logger }) {
    logger.info('Received domain event.', { domainEvent });
  }
};

module.exports = { sampleHandler };
