'use strict';

const { sampleHandler } = require('./handlers/sampleHandler');

const sampleFlow = {
  domainEventHandlers: {
    sampleHandler
  },
  enhancers: [
    flow => ({
      domainEventHandlers: {
        ...flow.domainEventHandlers,
        enhancedHandler: {
          isRelevant ({ fullyQualifiedName }) {
            return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
          },
          handle () {
            // Intentionally left empty.
          }
        }
      }
    })
  ]
};

module.exports = sampleFlow;
