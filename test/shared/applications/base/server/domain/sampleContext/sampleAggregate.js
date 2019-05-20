'use strict';

const initialState = {};

const commands = {
  execute: {
    schema: {
      type: 'object',
      properties: {
        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
      },
      required: [ 'strategy' ],
      additionalProperties: false
    },

    isAuthorized () {
      return true;
    },

    handle (sampleAggregate, command) {
      const { strategy } = command.data;

      if (strategy === 'fail') {
        throw new Error('Intentionally failed execute.');
      }

      if (strategy === 'reject') {
        return command.reject('Intentionally rejected execute.');
      }

      sampleAggregate.events.publish('succeeded');
      sampleAggregate.events.publish('executed', { strategy });
    }
  }
};

const events = {
  succeeded: {
    handle () {
      // Intentionally left blank.
    },

    isAuthorized () {
      return true;
    }
  },

  executed: {
    schema: {
      type: 'object',
      properties: {
        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
      },
      required: [ 'strategy' ],
      additionalProperties: false
    },

    handle () {
      // Intentionally left blank.
    },

    isAuthorized () {
      return true;
    }
  }
};

module.exports = { initialState, commands, events };
