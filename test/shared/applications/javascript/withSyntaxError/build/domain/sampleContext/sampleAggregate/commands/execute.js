'use strict';

// The syntax is intentionally broken here for testing.
const execute
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

  handle (state, command, { aggregate }) {
    const { strategy } = command.data;

    if (strategy === 'fail') {
      throw new Error('Intentionally failed execute.');
    }

    if (strategy === 'reject') {
      // Uncomment: throw new errors.CommandRejected('Intentionally rejected execute.');
      throw new Error('Intentionally rejected execute.');
    }

    aggregate.publishDomainEvent('succeeded', {});
    aggregate.publishDomainEvent('executed', { strategy });
  }
};

module.exports = {
  execute
};
