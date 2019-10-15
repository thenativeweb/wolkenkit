'use strict';

const { initialState, commands, events } = require('../../../base/server/domain/sampleContext/sampleAggregate');

events.executed.filter = function () {
  return true;
};

module.exports = { initialState, commands, events };
