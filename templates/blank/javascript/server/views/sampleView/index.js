'use strict';

const { all } = require('./queries/all');
const { flowSampleFlowUpdatedNotificationSubscriber } = require('./notificationSubscribers/flowSampleFlowUpdatedNotificationSubscriber');

const sampleView = {
  queryHandlers: {
    all
  },

  notificationSubscribers: {
    flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationSubscriber
  }
};

module.exports = sampleView;
