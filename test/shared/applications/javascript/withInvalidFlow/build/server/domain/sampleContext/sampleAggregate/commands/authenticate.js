'use strict';

const authenticate = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        allowAnonymous: { type: 'boolean' }
      },
      required: [ 'allowAnonymous' ],
      additionalProperties: false
    };
  },

  isAuthorized (state, command) {
    if (command.data.allowAnonymous) {
      return true;
    }

    return command.metadata.initiator.user.claims.iss !== 'https://token.invalid';
  },

  handle (state, command, { aggregate }) {
    aggregate.publishDomainEvent('authenticated', {});
  }
};

module.exports = {
  authenticate
};
