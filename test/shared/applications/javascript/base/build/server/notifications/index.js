'use strict';

const { commandExecuteNotificationHandler } = require('./handlers/commandExecuteNotificationHandler'),
      { complexNotificationHandler } = require('./handlers/complexNotificationHandler'),
      { flowSampleFlowUpdatedNotificationHandler } = require('./handlers/flowSampleFlowUpdatedNotificationHandler'),
      { viewSampleViewUpdatedNotificationHandler } = require('./handlers/viewSampleViewUpdatedNotificationHandler');

const notifications = {
  commandExecute: commandExecuteNotificationHandler,
  complex: complexNotificationHandler,
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
};

module.exports = notifications;
