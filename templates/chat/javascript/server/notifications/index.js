'use strict';

const { flowMessagesUpdated } = require('./handlers/flowMessagesUpdated');
const { viewMessagesUpdated } = require('./handlers/viewMessagesUpdated');

const notifications = {
  flowMessagesUpdated,
  viewMessagesUpdated
};

module.exports = notifications;
