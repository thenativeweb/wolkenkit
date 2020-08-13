'use strict';

const flowSampleFlowUpdatedNotificationSubscriber = {
  isRelevant ({ name }) {
    return name === 'flowSampleFlowUpdated';
  },

  async handle (data, { notification }) {
    await notification.publish('viewSampleViewUpdated', {});
  }
};

module.exports = { flowSampleFlowUpdatedNotificationSubscriber };
