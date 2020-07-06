'use strict';

const { authenticate } = require('./commands/authenticate'),
      { authorize } = require('./commands/authorize'),
      { execute } = require('./commands/execute'),
      { executeFromFlow } = require('./commands/executeFromFlow'),
      { triggerFlow } = require('./commands/triggerFlow'),
      { authenticated } = require('./domainEvents/authenticated'),
      { authorized } = require('./domainEvents/authorized'),
      { executed } = require('./domainEvents/executed'),
      { executedFromFlow } = require('./domainEvents/executedFromFlow'),
      { succeeded } = require('./domainEvents/succeeded'),
      { triggeredFlow } = require('./domainEvents/triggeredFlow'),
      { getInitialState } = require('./SampleState');

const sampleAggregate = {
  getInitialState,
  commandHandlers: {
    authenticate,
    authorize,
    execute,
    executeFromFlow,
    triggerFlow
  },
  domainEventHandlers: {
    authenticated,
    authorized,
    succeeded,
    executed,
    executedFromFlow,
    triggeredFlow
  }
};

module.exports = sampleAggregate;
