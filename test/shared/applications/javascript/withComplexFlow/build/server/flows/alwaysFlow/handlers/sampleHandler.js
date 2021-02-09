'use strict';

const sampleHandler = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.triggeredFlow';
  },

  async handle (domainEvent, { command }) {
    if (domainEvent.data.flowName !== 'alwaysFlow') {
      return;
    }

    await command.issueCommand({
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      name: 'executeFromFlow',
      data: {
        basedOnRevision: domainEvent.metadata.revision,
        fromFlow: 'alwaysFlow'
      }
    });
  }
};

module.exports = { sampleHandler };
