'use strict';

const triggerFlow = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        flowNames: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: [ 'flowNames' ],
      additionalProperties: false
    };
  },

  isAuthorized () {
    return true;
  },

  handle (state, command, { aggregate }) {
    const { flowNames } = command.data;

    for (const flowName of flowNames) {
      aggregate.publishDomainEvent('triggeredFlow', { flowName });
    }
  }
};

module.exports = {
  triggerFlow
};
