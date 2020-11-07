'use strict';

const { Readable } = require('stream');

const messages = {
  queryHandlers: {
    all: {
      type: 'stream',

      getResultItemSchema () {
        return {
          type: 'object',
          properties: {
            id: { type: 'string' },
            timestamp: { type: 'number' },
            text: { type: 'string' },
            likes: { type: 'number' }
          },
          required: [ 'id', 'timestamp', 'text', 'likes' ],
          additionalProperties: false
        };
      },

      async handle (options, { infrastructure }) {
        if (Array.isArray(infrastructure.ask.viewStore.messages)) {
          const sortedMessages = [ ...infrastructure.ask.viewStore.messages ].reverse();

          return Readable.from(sortedMessages);
        }

        return infrastructure.ask.viewStore.messages.find({}, {
          projection: { _id: 0, id: 1, timestamp: 1, text: 1, likes: 1 },
          sort: [[ 'timestamp', -1 ]]
        }).stream();
      },

      isAuthorized () {
        return true;
      }
    }
  },

  notificationSubscribers: {
    flowMessagesUpdatedNotificationSubscriber: {
      isRelevant ({ name }) {
        return name === 'flowMessagesUpdated';
      },

      async handle (data, { notification }) {
        await notification.publish('viewMessagesUpdated', {});
      }
    }
  }
};

module.exports = messages;
