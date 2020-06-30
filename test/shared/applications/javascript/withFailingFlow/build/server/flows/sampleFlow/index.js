'use strict';

const { failingHandler } = require('./handlers/failingHandler');

const sampleFlow = {
  domainEventHandlers: {
    failingHandler
  }
};

module.exports = sampleFlow;
