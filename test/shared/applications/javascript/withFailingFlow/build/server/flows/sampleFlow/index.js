'use strict';

const { failingHandler } = require('./handlers/failingHandler');

const sampleFlow = {
  replayPolicy: 'never',

  domainEventHandlers: {
    failingHandler
  }
};

module.exports = sampleFlow;
