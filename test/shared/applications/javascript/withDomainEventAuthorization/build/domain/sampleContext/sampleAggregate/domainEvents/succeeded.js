'use strict';

const succeeded = {
  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'succeeded' ]
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = {
  succeeded
};
