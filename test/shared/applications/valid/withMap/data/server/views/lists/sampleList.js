'use strict';

const { fields, projections, queries } = require('../../../base/server/views/lists/sampleList');

queries.readItem.map = function (sampleList, item) {
  return item;
};

module.exports = { fields, projections, queries };
