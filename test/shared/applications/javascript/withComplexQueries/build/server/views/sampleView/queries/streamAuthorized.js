'use strict';

const { Readable } = require('stream');

const streamAuthorized = {
  type: 'stream',

  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        aggregateIdentifier: {
          type: 'object',
          properties: {
            context: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1 }
              },
              required: [ 'name' ],
              additionalProperties: false
            },
            aggregate: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1 },
                id: { type: 'string' }
              },
              required: [ 'name', 'id' ],
              additionalProperties: false
            }
          },
          required: [ 'context', 'aggregate' ],
          additionalProperties: false
        },
        name: { type: 'string', minLength: 1 },
        id: { type: 'string' }
      },
      required: [ 'aggregateIdentifier', 'name', 'id' ],
      additionalProperties: false
    };
  },

  async handle (options, { infrastructure }) {
    return Readable.from(infrastructure.ask.viewStore.domainEvents);
  },

  isAuthorized (viewItem, { client }) {
    return client.user.id === 'jane.doe';
  }
};

module.exports = { streamAuthorized };
