'use strict';

const { flowSampleFlowUpdatedNotificationHandler } = require('./handlers/flowSampleFlowUpdatedNotificationHandler'),
      { invalidNotificationHandler } = require('./handlers/invalidNotificationHandler'),
      { viewSampleViewUpdatedNotificationHandler } = require('./handlers/viewSampleViewUpdatedNotificationHandler');

const notifications = {
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  invalid: invalidNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
};

module.exports = notifications;
