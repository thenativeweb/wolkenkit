'use strict';

const { all } = require('./queries/all');
const { first } = require('./queries/first');

const sampleView = {
  queryHandlers: {
    all,
    first
  }
};

module.exports = sampleView;
