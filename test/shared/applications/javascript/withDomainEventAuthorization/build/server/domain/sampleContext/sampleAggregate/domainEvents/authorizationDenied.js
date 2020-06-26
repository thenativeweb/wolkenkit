'use strict';

const authorizationDenied = {
  handle () {
    return {};
  },

  isAuthorized () {
    return false;
  }
};

module.exports = {
  authorizationDenied
};
