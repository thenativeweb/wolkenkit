'use strict';

const { all } = require('./queries/all');
const { initializer } = require('./initializer');
const { liked } = require('./projections/liked');
const { sent } = require('./projections/sent');

const messages = {
  initializer,
  projectionHandlers: {
    sent,
    liked
  },
  queryHandlers: {
    all
  }
};

module.exports = messages;
