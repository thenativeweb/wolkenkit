'use strict';

const filterFailed = {
  handle () {
    return {};
  },

  isAuthorized () {
    return true;
  },

  filter () {
    throw new Error('Filter failed.');
  }
};

module.exports = {
  filterFailed
};
