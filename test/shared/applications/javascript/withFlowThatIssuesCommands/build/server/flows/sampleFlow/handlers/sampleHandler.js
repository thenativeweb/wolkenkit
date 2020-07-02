'use strict';

const sampleHandler = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  async handle (domainEvent, { command }) {
    await command.issueCommand({
      contextIdentifier: domainEvent.contextIdentifier,
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      name: 'executeFromFlow',
      data: {}
    });
  }
};

module.exports = { sampleHandler };
