'use strict';

const mapApplied = {
  handle () {
    return {};
  },

  isAuthorized () {
    return true;
  },

  map (state, domainEvent) {
    /* eslint-disable no-param-reassign */
    domainEvent.data.isMapped = true;
    /* eslint-enable no-param-reassign */

    return domainEvent;
  }
};

module.exports = {
  mapApplied
};
