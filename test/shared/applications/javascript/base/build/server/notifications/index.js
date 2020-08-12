'use strict';

const { commandExecuteNotificationHandler } = require('./handlers/commandExecuteNotificationHandler'),
      { flowSampleFlowUpdatedNotificationHandler } = require('./handlers/flowSampleFlowUpdatedNotificationHandler'),
      { viewSampleViewUpdatedNotificationHandler } = require('./handlers/viewSampleViewUpdatedNotificationHandler');

const notifications = {
  commandExecute: commandExecuteNotificationHandler,
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
};

module.exports = notifications;
