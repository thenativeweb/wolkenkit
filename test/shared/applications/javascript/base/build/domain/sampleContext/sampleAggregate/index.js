'use strict';

const { authorize } = require('./commands/authorize'),
      { execute } = require('./commands/execute'),
      { authorized } = require('./domainEvents/authorized'),
      { executed } = require('./domainEvents/executed'),
      { succeeded } = require('./domainEvents/succeeded'),
      { getInitialState } = require('./SampleState');

const sampleAggregate = {
  getInitialState,
  commandHandlers: {
    authorize,
    execute
  },
  domainEventHandlers: {
    authorized,
    succeeded,
    executed
  }
};

module.exports = sampleAggregate;
