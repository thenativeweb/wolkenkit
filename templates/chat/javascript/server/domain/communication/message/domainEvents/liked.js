'use strict';

const liked = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        likes: { type: 'number' }
      },
      required: [ 'likes' ],
      additionalProperties: false
    };
  },

  handle (state, domainEvent) {
    return {
      ...state,
      likes: domainEvent.data.likes
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { liked };
