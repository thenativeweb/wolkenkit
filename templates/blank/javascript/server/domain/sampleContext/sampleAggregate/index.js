'use strict';

const { sampleCommand } = require('./commands/sampleCommand'),
      { sampleDomainEvent } = require('./domainEvents/sampleDomainEvent'),
      { getInitialState } = require('./SampleState');

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
