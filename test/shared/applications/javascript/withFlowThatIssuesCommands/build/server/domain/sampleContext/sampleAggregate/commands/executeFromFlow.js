'use strict';

const executeFromFlow = {
  getSchema () {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  isAuthorized () {
    return true;
  },

  handle (state, command, { aggregate }) {
    aggregate.publishDomainEvent('executedFromFlow');
  }
};

module.exports = {
  executeFromFlow
};
