'use strict';

const { authenticate } = require('./commands/authenticate'),
      { authorize } = require('./commands/authorize'),
      { execute } = require('./commands/execute'),
      { authenticated } = require('./domainEvents/authenticated'),
      { authorized } = require('./domainEvents/authorized'),
      { executed } = require('./domainEvents/executed'),
      { succeeded } = require('./domainEvents/succeeded'),
      { getInitialState } = require('./SampleState');

const sampleAggregate = {
  getInitialState,
  commandHandlers: {
    authenticate,
    authorize,
    execute
  },
  domainEventHandlers: {
    authenticated,
    authorized,
    succeeded,
    executed
  }
};

module.exports = sampleAggregate;
