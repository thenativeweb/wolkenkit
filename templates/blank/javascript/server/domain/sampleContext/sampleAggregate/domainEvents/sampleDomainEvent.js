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

  handle () {
    return {
      // ...
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { sampleDomainEvent };
