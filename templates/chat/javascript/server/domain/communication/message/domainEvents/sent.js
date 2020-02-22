'use strict';

const sent = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: [ 'text' ],
      additionalProperties: false
    };
  },

  handle (state, domainEvent) {
    return {
      ...state,
      text: domainEvent.data.text
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { sent };
