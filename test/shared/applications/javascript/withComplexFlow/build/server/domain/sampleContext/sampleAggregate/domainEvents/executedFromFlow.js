'use strict';

const executedFromFlow = {
  getSchema () {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'executedFromFlow' ]
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = {
  executedFromFlow
};
