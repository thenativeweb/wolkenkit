'use strict';

const failingHandler = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  handle () {
    throw new Error('An expected error occured.');
  }
};

module.exports = { failingHandler };
