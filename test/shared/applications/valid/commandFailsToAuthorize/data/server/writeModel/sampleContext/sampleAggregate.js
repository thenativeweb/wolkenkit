'use strict';

const { initialState, commands, events } = require('../../../base/server/writeModel/sampleContext/sampleAggregate');

commands.execute.isAuthorized = function () {
  throw new Error('Is authorized failed.');
};

module.exports = { initialState, commands, events };
