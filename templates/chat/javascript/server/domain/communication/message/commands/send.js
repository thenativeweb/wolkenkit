'use strict';

const send = {
  getSchema () {
    return {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: [ 'text' ],
      additionalProperties: false
    };
  },

  isAuthorized () {
    return true;
  },

  handle (state, command, { aggregate, error }) {
    if (!command.data.text) {
      throw new error.CommandRejected('Text is missing.');
    }
    if (!aggregate.isPristine()) {
      throw new error.CommandRejected('Message was already sent.');
    }

    aggregate.publishDomainEvent('sent', {
      text: command.data.text
    });
  }
};

module.exports = { send };
