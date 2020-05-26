'use strict';

const authorizationFailed = {
  handle () {
    return {};
  },

  isAuthorized () {
    throw new Error('Is authorized failed.');
  }
};

module.exports = {
  authorizationFailed
};
