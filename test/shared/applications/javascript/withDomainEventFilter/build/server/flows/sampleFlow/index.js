'use strict';

const { sampleHandler } = require('./handlers/sampleHandler');

const sampleFlow = {
  domainEventHandlers: {
    sampleHandler
  }
};

module.exports = sampleFlow;
