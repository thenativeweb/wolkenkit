'use strict';

const { sampleHandler } = require('./handlers/sampleHandler');

const sampleFlow = {
  replayPolicy: 'on-demand',

  domainEventHandlers: {
    sampleHandler
  }
};

module.exports = sampleFlow;
