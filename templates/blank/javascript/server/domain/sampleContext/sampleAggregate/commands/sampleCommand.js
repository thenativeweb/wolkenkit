'use strict';

const sampleCommand = {
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
    aggregate.publishDomainEvent('sampleDomainEvent', {});
  }
};

module.exports = { sampleCommand };
