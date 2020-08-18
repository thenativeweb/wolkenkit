'use strict';

const notifications = {
  flowMessagesUpdated: {
    isAuthorized () {
      return true;
    }
  },
  viewMessagesUpdated: {
    isAuthorized () {
      return true;
    }
  }
};

module.exports = notifications;
