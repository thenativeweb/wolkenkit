'use strict';

const authenticated = {
  getSchema () {
    return {
      type: 'object',
      properties: {},
      additionalProperties: false
    };
  },

  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'authenticated' ]
    };
  },

  isAuthorized (state, domainEvent, { client }) {
    return client.user.claims.iss !== 'https://token.invalid';
  }
};

module.exports = {
  authenticated
};
