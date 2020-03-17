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
    // Reject authorization if we cannot see the state properties. That allows
    // to verify that `handleCommand` passes the state value instead of the
    // `CurrentAggregateState` wrapper object.
    if (!state.domainEventNames) {
      return false;
    }

    return command.data.shouldAuthorize;
  },

  handle (state, command, { aggregate }) {
    aggregate.publishDomainEvent('authorized', {});
  }
};

module.exports = {
  authorize
};
