'use strict';

const { all } = require('./queries/all'),
      { initializer } = require('./initializer'),
      { sampleProjection } = require('./projections/sampleProjection');

const sampleView = {
  initializer,
  projectionHandlers: {
    sampleProjection
  },
  queryHandlers: {
    all
  }
};

module.exports = sampleView;
