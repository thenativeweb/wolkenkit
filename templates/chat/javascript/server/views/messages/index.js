'use strict';

const { all } = require('./queries/all');
const { flowMessagesUpdatedNotificationSubscriber } = require('./notificationSubscribers/flowMessagesUpdatedNotificationSubscriber');

const messages = {
  queryHandlers: {
    all
  },

  notificationSubscribers: {
    flowMessagesUpdatedNotificationSubscriber
  }
};

module.exports = messages;
