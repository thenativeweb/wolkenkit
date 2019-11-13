'use strict';

const mapWithMutation = {
  handle () {
    return {};
  },

  isAuthorized () {
    return true;
  },

  map (state, domainEvent) {
    /* eslint-disable no-param-reassign */
    domainEvent.data.isMutated = true;
    /* eslint-enable no-param-reassign */

    return domainEvent;
  }
};

module.exports = {
  mapWithMutation
};
