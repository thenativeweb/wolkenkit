'use strict';

const { flowSampleFlowUpdated } = require('./handlers/flowSampleFlowUpdated');
const { viewSampleViewUpdated } = require('./handlers/viewSampleViewUpdated');

const notifications = {
  flowSampleFlowUpdated,
  viewSampleViewUpdated
};

module.exports = notifications;
