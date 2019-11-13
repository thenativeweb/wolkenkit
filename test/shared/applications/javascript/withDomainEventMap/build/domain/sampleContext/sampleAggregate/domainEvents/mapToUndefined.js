'use strict';

const mapToUndefined = {
  handle () {
    return {};
  },

  isAuthorized () {
    return true;
  },

  map () {
    /* eslint-disable no-useless-return */
    // Explicitly return undefined, so that the domain event gets filtered out.
    return;
    /* eslint-enable no-useless-return */
  }
};

module.exports = {
  mapToUndefined
};
