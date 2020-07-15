'use strict';

const { all } = require('./queries/all');

const sampleView = {
  queryHandlers: {
    all
  }
};

module.exports = sampleView;
