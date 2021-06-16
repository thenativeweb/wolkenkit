'use strict';

const flowSampleFlowUpdatedNotificationSubscriber = {
  isRelevant ({ name }) {
    return name === 'flowSampleFlowUpdated';
  },

  handle (data, { notification }) {
    notification.publish('viewSampleViewUpdated', {});
  }
};

module.exports = { flowSampleFlowUpdatedNotificationSubscriber };
