'use strict';

const { fields, projections, queries } = require('../../../base/server/views/lists/sampleList');

queries.readItem.filter = function () {
  return true;
};

module.exports = { fields, projections, queries };
