'use strict';

const executedFromFlow = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        basedOnRevision: { type: 'number' },
        fromFlow: { type: 'string' }
      },
      required: [ 'basedOnRevision', 'fromFlow' ],
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
