'use strict';

const { getInitialState } = require('./SampleState'),
      { sampleCommand } = require('./commands/sampleCommand'),
      { sampleDomainEvent } = require('./domainEvents/sampleDomainEvent');

const sampleAggregate = {
  getInitialState,
  commandHandlers: {
    sampleCommand
  },
  domainEventHandlers: {
    sampleDomainEvent
  }
};

module.exports = sampleAggregate;
