'use strict';

const { execute } = require('./commands/execute'),
      { executed } = require('./domainEvents/executed'),
      { filterDenied } = require('./domainEvents/filterDenied'),
      { filterFailed } = require('./domainEvents/filterFailed'),
      { filterPassed } = require('./domainEvents/filterPassed'),
      { filterWithMutation } = require('./domainEvents/filterWithMutation'),
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
    filterDenied,
    filterFailed,
    filterPassed,
    filterWithMutation
  }
};

module.exports = sampleAggregate;
