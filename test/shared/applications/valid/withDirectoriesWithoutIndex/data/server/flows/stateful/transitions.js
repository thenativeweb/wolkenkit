'use strict';

const transitions = {
  pristine: {
    'sampleContext.sampleAggregate.succeeded' (flow, event) {
      // ...
    },

    'sampleContext.sampleAggregate.executed' (flow, event) {
      // ...
    }
  }
};

module.exports = transitions;
