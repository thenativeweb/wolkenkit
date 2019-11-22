'use strict';

const filterWithMutation = {
  handle () {
    return {};
  },

  isAuthorized () {
    return true;
  },

  filter (state, domainEvent) {
    /* eslint-disable no-param-reassign */
    domainEvent.data.isMutated = true;
    /* eslint-enable no-param-reassign */

    return true;
  }
};

module.exports = {
  filterWithMutation
};
