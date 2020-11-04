'use strict';

const message = {
  getInitialState () {
    return {
      text: '',
      likes: 0
    };
  },

  commandHandlers: {
    send: {
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
    },

    like: {
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
    }
  },

  domainEventHandlers: {
    sent: {
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

      handle (state, domainEvent) {
        return {
          ...state,
          text: domainEvent.data.text
        };
      },

      isAuthorized () {
        return true;
      }
    },

    liked: {
      getSchema () {
        return {
          type: 'object',
          properties: {
            likes: { type: 'number' }
          },
          required: [ 'likes' ],
          additionalProperties: false
        };
      },

      handle (state, domainEvent) {
        return {
          ...state,
          likes: domainEvent.data.likes
        };
      },

      isAuthorized () {
        return true;
      }
    }
  }
};

module.exports = message;
