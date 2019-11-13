'use strict';

const authorizationWithMutation = {
  handle () {
    return {};
  },

  isAuthorized (state, domainEvent) {
    /* eslint-disable no-param-reassign */
    domainEvent.data.isMutated = true;
    /* eslint-enable no-param-reassign */

    return true;
  }
};

module.exports = {
  authorizationWithMutation
};
