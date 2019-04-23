'use strict';

/* eslint-disable no-unused-vars */
const nonExistent = require('non-existent');
/* eslint-enable no-unused-vars */

const identity = {
  /* eslint-disable no-unused-vars */
  'planning.peerGroup.started' (event) {
    // ...
  },

  'planning.peerGroup.joined' (event) {
    // ...
  }
  /* eslint-enable no-unused-vars */
};

const initialState = {
  is: 'pristine'
};

const transitions = {
  pristine: {
    /* eslint-disable no-unused-vars */
    'planning.peerGroup.started' (flow, event) {
      // ...
    },

    'planning.peerGroup.joined' (flow, event) {
      // ...
    }
    /* eslint-enable no-unused-vars */
  }
};

const reactions = {
  pristine: {
    /* eslint-disable no-unused-vars */
    'another-state' (flow, event) {
      // ...
    }
    /* eslint-enable no-unused-vars */
  }
};

module.exports = { identity, initialState, transitions, reactions };
