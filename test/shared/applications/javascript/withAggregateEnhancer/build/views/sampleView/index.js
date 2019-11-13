'use strict';

const { all } = require('./queries/all'),
      { executed } = require('./projections/executed'),
      { initializer } = require('./initializer');

const sampleView = {
  initializer,
  projectionHandlers: {
    executed
  },
  queryHandlers: {
    all
  }
};

module.exports = sampleView;
