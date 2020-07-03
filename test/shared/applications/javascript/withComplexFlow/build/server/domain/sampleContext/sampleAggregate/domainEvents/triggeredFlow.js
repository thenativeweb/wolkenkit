'use strict';

const triggeredFlow = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        flowName: { type: 'string' }
      },
      required: [ 'flowName' ],
      additionalProperties: false
    };
  },

  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'triggeredFlow' ]
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = {
  triggeredFlow
};
