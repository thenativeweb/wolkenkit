'use strict';

const { all } = require('./queries/all');
const { flowSampleFlowUpdatedNotificationSubscriber } = require('./notificationSubscribers/flowSampleFlowUpdatedNotificationSubscriber');
const { hardcoded } = require('./queries/hardcoded');

const sampleView = {
  queryHandlers: {
    all,
    hardcoded
  },
  notificationSubscribers: {
    flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationSubscriber
  }
};

module.exports = sampleView;
