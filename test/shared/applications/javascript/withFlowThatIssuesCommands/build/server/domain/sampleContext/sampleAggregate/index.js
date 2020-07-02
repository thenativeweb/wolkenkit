'use strict';

const { authenticate } = require('./commands/authenticate'),
      { authorize } = require('./commands/authorize'),
      { execute } = require('./commands/execute'),
      { executeFromFlow } = require('./commands/executeFromFlow'),
      { authenticated } = require('./domainEvents/authenticated'),
      { authorized } = require('./domainEvents/authorized'),
      { executed } = require('./domainEvents/executed'),
      { executedFromFlow } = require('./domainEvents/executedFromFlow'),
      { succeeded } = require('./domainEvents/succeeded'),
      { getInitialState } = require('./SampleState');

const sampleAggregate = {
  getInitialState,
  commandHandlers: {
    authenticate,
    authorize,
    execute,
    executeFromFlow
  },
  domainEventHandlers: {
    authenticated,
    authorized,
    succeeded,
    executed,
    executedFromFlow
  }
};

module.exports = sampleAggregate;
