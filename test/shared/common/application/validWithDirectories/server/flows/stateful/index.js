'use strict';

const identity = require('./identity'),
      initialState = require('./initialState'),
      reactions = require('./reactions'),
      transitions = require('./transitions');

module.exports = { identity, initialState, transitions, reactions };
