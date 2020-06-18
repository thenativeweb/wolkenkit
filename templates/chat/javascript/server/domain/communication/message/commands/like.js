'use strict';

const like = {
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

  handle (state, command, { aggregate, error }) {
    if (aggregate.isPristine()) {
      throw new error.CommandRejected('Message was not yet sent.');
    }

    aggregate.publishDomainEvent('liked', {
      likes: state.likes + 1
    });
  }
};

module.exports = { like };
