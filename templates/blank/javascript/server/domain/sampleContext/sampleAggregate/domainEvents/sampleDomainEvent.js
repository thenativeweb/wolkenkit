'use strict';

const sampleDomainEvent = {
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
      domainEventNames: [ ...state.domainEventNames, 'sampleDomainEvent' ]
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { sampleDomainEvent };
