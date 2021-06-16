'use strict';

const { complexNotificationHandler } = require('./handlers/complexNotificationHandler'),
      { flowSampleFlowUpdatedNotificationHandler } = require('./handlers/flowSampleFlowUpdatedNotificationHandler'),
      { viewSampleViewUpdatedNotificationHandler } = require('./handlers/viewSampleViewUpdatedNotificationHandler');

const notifications = {
  complex: complexNotificationHandler,
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
};

module.exports = notifications;
