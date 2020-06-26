'use strict';

const authorized = {
  getSchema () {
    return {
      type: 'object',
      properties: {},
      additionalProperties: false
    };
  },

  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'authorized' ]
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = {
  authorized
};
