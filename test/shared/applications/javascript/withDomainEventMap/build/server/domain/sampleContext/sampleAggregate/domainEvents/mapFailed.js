'use strict';

const mapFailed = {
  handle () {
    return {};
  },

  isAuthorized () {
    return true;
  },

  map () {
    throw new Error('Map failed.');
  }
};

module.exports = {
  mapFailed
};
