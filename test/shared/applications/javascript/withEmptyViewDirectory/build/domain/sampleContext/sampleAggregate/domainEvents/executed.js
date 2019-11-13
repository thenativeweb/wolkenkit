'use strict';

const executed = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
      },
      required: [ 'strategy' ],
      additionalProperties: false
    };
  },

  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'executed' ]
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = {
  executed
};
