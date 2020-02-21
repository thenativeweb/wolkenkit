'use strict';

const { getInitialState } = require('./SampleState');
const { sampleCommand } = require('./commands/sampleCommand');
const { sampleDomainEvent } = require('./domainEvents/sampleDomainEvent');

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
