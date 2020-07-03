'use strict';

const executeFromFlow = {
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
