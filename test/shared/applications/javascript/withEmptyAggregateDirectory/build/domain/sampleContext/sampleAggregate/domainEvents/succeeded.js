'use strict';

const succeeded = {
  isAuthorized () {
    return true;
  },

  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'succeeded' ]
    };
  }
};

module.exports = {
  succeeded
};
