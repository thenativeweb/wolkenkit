'use strict';

const { initialState, commands, events } = require('../../../base/server/writeModel/sampleContext/sampleAggregate');

commands.execute.isAuthorized = function () {
  return false;
};

module.exports = { initialState, commands, events };
