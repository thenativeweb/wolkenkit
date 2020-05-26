'use strict';

const filterPassed = {
  handle () {
    return {};
  },

  isAuthorized () {
    return true;
  },

  filter () {
    return true;
  }
};

module.exports = {
  filterPassed
};
