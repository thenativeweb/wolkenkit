'use strict';

const filterDenied = {
  handle () {
    return {};
  },

  isAuthorized () {
    return true;
  },

  filter () {
    return false;
  }
};

module.exports = {
  filterDenied
};
