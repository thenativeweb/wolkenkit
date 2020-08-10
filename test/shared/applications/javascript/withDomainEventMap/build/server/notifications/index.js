'use strict';

const { flowSampleFlowUpdatedNotificationHandler } = require('./handlers/flowSampleFlowUpdatedNotificationHandler'),
      { viewSampleViewUpdatedNotificationHandler } = require('./handlers/viewSampleViewUpdatedNotificationHandler');

const notifications = {
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
};

module.exports = notifications;
