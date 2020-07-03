'use strict';

const { sampleHandler } = require('./handlers/sampleHandler');

const sampleFlow = {
  replayPolicy: 'never',

  domainEventHandlers: {
    sampleHandler
  }
};

module.exports = sampleFlow;
