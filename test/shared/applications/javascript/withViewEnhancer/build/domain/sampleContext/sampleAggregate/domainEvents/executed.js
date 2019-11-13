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

  isAuthorized () {
    return true;
  },

  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'executed' ]
    };
  }
};

module.exports = {
  executed
};
