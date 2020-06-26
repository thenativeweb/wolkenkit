'use strict';

const { execute } = require('./commands/execute'),
      { executed } = require('./domainEvents/executed'),
      { succeeded } = require('./domainEvents/succeeded'),
      { getInitialState } = require('./SampleState');

const sampleAggregate = {
  getInitialState,
  commandHandlers: {
    execute
  },
  domainEventHandlers: {
    succeeded,
    executed
  }
};

module.exports = sampleAggregate;
