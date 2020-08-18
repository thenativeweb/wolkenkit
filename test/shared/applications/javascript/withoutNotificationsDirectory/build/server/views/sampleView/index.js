'use strict';

const { all } = require('./queries/all'),
      { flowSampleFlowUpdatedNotificationSubscriber } = require('./notificationSubscribers/flowSampleFlowUpdatedNotificationSubscriber');

const sampleView = {
  queryHandlers: {
    all
  },
  notificationSubscribers: {
    flowSampleFlowUpdatedNotificationSubscriber
  }
};

module.exports = sampleView;
