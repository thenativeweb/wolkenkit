'use strict';

const authorize = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        shouldAuthorize: { type: 'boolean' }
      },
      required: [ 'shouldAuthorize' ],
      additionalProperties: false
    };
  },

  isAuthorized (state, command) {
    return command.data.shouldAuthorize;
  },

  handle (state, command, { aggregate }) {
    aggregate.publishDomainEvent('authorized', {});
  }
};

module.exports = {
  authorize
};
