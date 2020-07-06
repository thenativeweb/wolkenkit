'use strict';

const { sampleHandler } = require('./handlers/sampleHandler');

const sampleFlow = {
  replayPolicy: 'always',

  domainEventHandlers: {
    sampleHandler
  }
};

module.exports = sampleFlow;
