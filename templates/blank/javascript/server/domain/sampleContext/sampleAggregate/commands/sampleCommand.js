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

  handle () {
    // ...
  }
};

module.exports = { sampleCommand };
