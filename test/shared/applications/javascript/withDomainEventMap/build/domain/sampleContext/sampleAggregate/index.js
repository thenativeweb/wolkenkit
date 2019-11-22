'use strict';

const { execute } = require('./commands/execute'),
      { executed } = require('./domainEvents/executed'),
      { mapApplied } = require('./domainEvents/mapApplied'),
      { mapFailed } = require('./domainEvents/mapFailed'),
      { mapToUndefined } = require('./domainEvents/mapToUndefined'),
      { mapWithMutation } = require('./domainEvents/mapWithMutation'),
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
    mapApplied,
    mapFailed,
    mapToUndefined,
    mapWithMutation
  }
};

module.exports = sampleAggregate;
