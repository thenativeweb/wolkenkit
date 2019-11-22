'use strict';

const { authorizationDenied } = require('./domainEvents/authorizationDenied'),
      { authorizationFailed } = require('./domainEvents/authorizationFailed'),
      { authorizationWithMutation } = require('./domainEvents/authorizationWithMutation'),
      { execute } = require('./commands/execute'),
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
    executed,
    authorizationDenied,
    authorizationFailed,
    authorizationWithMutation
  }
};

module.exports = sampleAggregate;
