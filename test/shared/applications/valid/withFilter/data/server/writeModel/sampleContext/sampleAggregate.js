'use strict';

const { initialState, commands, events } = require('../../../base/server/writeModel/sampleContext/sampleAggregate');

events.executed.filter = function () {
  return true;
};

module.exports = { initialState, commands, events };
