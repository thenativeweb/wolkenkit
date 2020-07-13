'use strict';

const { all } = require('./queries/all');
const { hardcoded } = require('./queries/hardcoded');

const sampleView = {
  queryHandlers: {
    all,
    hardcoded
  }
};

module.exports = sampleView;
