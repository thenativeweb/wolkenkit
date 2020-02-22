'use strict';

const { all } = require('./queries/all');
const { initializer } = require('./initializer');
const { sampleProjection } = require('./projections/sampleProjection');

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
