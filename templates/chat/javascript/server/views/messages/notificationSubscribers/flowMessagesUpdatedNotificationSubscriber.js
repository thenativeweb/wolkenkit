'use strict';

const flowMessagesUpdatedNotificationSubscriber = {
  isRelevant ({ name }) {
    return name === 'flowMessagesUpdated';
  },

  async handle (data, { notification }) {
    await notification.publish('viewMessagesUpdated', {});
  }
};

module.exports = { flowMessagesUpdatedNotificationSubscriber };
