'use strict';

const { Readable } = require('stream');

const all = {
  type: 'stream',

  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        contextIdentifier: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 }
          },
          required: [ 'name' ],
          additionalProperties: false
        },
        aggregateIdentifier: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            id: { type: 'string' }
          },
          required: [ 'name', 'id' ],
          additionalProperties: false
        },
        name: { type: 'string', minLength: 1 },
        id: { type: 'string' }
      },
      required: [ 'contextIdentifier', 'aggregateIdentifier', 'name', 'id' ],
      additionalProperties: false
    };
  },

  async handle (options, { infrastructure }) {
    return Readable.from(infrastructure.ask.viewStore.domainEvents);
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { all };
