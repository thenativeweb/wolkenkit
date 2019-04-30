'use strict';

const { initialState, commands, events } = require('../../../base/server/domain/sampleContext/sampleAggregate');

events.executed.map = function (event) {
  return event;
};

module.exports = { initialState, commands, events };
