'use strict';

const { fields, projections, queries } = require('../../../base/server/readModel/lists/sampleList');

queries.readItem.filter = function () {
  return true;
};

module.exports = { fields, projections, queries };
