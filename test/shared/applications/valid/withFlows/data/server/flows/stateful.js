'use strict';

const identity = {
  'sampleContext.sampleAggregate.succeeded' (event) {
    // ...
  },

  'sampleContext.sampleAggregate.executed' (event) {
    // ...
  }
};

const initialState = {
  is: 'pristine'
};

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

const reactions = {
  pristine: {
    'another-state' (flow, event) {
      // ...
    }
  }
};

module.exports = { identity, initialState, transitions, reactions };
