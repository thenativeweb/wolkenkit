'use strict';

const succeeded = {
  getSchema () {
    return {
      type: 'object',
      properties: {},
      additionalProperties: false
    };
  },

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
