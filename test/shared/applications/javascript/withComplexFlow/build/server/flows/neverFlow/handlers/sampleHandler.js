'use strict';

const sampleHandler = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.triggeredFlow';
  },

  async handle (domainEvent, { command }) {
    if (domainEvent.data.flowName !== 'neverFlow') {
      return;
    }

    await command.issueCommand({
      contextIdentifier: domainEvent.contextIdentifier,
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      name: 'executeFromFlow',
      data: {
        basedOnRevision: domainEvent.metadata.revision,
        fromFlow: 'neverFlow'
      }
    });
  }
};

module.exports = { sampleHandler };
